import React, { FunctionComponent, useEffect, useState, useCallback } from "react"
import {  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Link, Typography, Slider, Chip } from "@mui/material";
import Grid from "components/Grid";
import { GridSortModel } from "@mui/x-data-grid"
import DateAdapter from "@mui/lab/AdapterDayjs";
import { Helmet } from "react-helmet";
import makeStyles from "makeStyles";
import { Add } from "@mui/icons-material";
import { Link as RouterLink, useHistory } from "react-router-dom";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"
import enGB from "dayjs/locale/en-gb"

import { ODataGrid, ODataGridColDef, QueryStringCollection } from "o-data-grid";
import { LocationFilter } from "types";
import Categories from "components/Categories";
import { numericOperators } from "o-data-grid/FilterBuilder/constants";

type SearchFilter = {
  term?: string,
  location?: string,
  distance?: number,
  posted?: Date,
  categories: number[],
  status?: string,
  recruiter?: boolean
}

const toQuery = (f: SearchFilter) =>  {
  let result:[string, string | undefined][] = [
    ["term", f.term],
    ["location", f.location],
    ["distance", f.distance?.toString()],
    ["posted", f.posted?.toISOString()],
    ["status", f.status]
  ]

  if (f.recruiter !== undefined) {
    result.push(["recruiter", String(f.recruiter)]);
  }

  f.categories.forEach(c => result.push(["categories", c.toString()]))
  return result;
};

type Category = {
  id: number,
  name: string
}

type JobPosted = {
  Posted: string
}

type Company = {
  name: string,
  location: string,
  website?: string,
  glassdoor?: string,
  linkedin?: string,
  endole?: string
}

const useStyles = makeStyles()((theme) => ({
  dialog: {
    minWidth: "40em",
    maxWidth: "100%",
    [theme.breakpoints.down('md')]: {
      minWidth: 0
    }
  }
}));

dayjs.extend(relativeTime);
dayjs.extend(utc);

const columns: ODataGridColDef[] = [
  {
    field: "Name",
    select: "Name,Recruiter,Blacklisted,Watched",
    headerName: "Name",
    flex: 2,
    renderCell: (params) => (
      <Link
        component={RouterLink}
        to={`/company/${params.id}`}
      >
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            {params.value}
          </Grid>
          {params.row["Company/Recruiter"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Recruiter" size="small" /></Grid>}
          {params.row["Company/Blacklisted"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Blacklisted" size="small" color="error" /></Grid>}
          {params.row["Company/Watched"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Watched" size="small" color="primary" /></Grid>}
        </Grid>
      </Link>
    )
  },
  {
    field: "Location",
    headerName: "Location",
    flex: 1,
    sortable: false,
    renderCustomFilter: (value, setValue) => (
      <Grid item container xs={12} md spacing={1}>
        <Grid item xs={12} md>
          <TextField
            value={(value as LocationFilter)?.location ?? ""}
            onChange={(e) => setValue({ ...value, location: e.target.value })}
            size="small"
            fullWidth
            label="Search Location"
            required
          />
        </Grid>
        <Grid item xs={12} md>
          <Typography variant="body2">Distance</Typography>
          <Slider
            value={(value as LocationFilter)?.distance ?? 15}
            onChange={(_, val) => setValue({ ...value, distance: val as number })}
            step={5}
            min={0}
            max={50}
            valueLabelFormat={(val) => `${val}mi`}
            valueLabelDisplay="auto"
            size="small"
            sx={{padding: 0}}
          />
        </Grid>
      </Grid>
    ),
    getCustomQueryString: (_, v) => {
      const filter = v as LocationFilter;
      let result: QueryStringCollection = {};
      if (filter.location) {
        result["location"] = filter.location!;
        result["distance"] = (filter.distance ?? 15).toString();
      }

      return result;
    },
  },
  {
    field: "LatestJob",
    headerName: "Latest job posted",
    expand: { navigationField: "Jobs", select: "Posted", orderBy: "Posted desc", top: 1 },
    type: "datetime",
    filterable: false,
    sortable: false,
    renderCell: (params) => {
      const jobs = params.row["Jobs"] as JobPosted[];
      if (jobs && jobs.length > 0) {
        return dayjs(jobs[0].Posted).format("DD/MM/YYYY HH:mm");
      } else {
        return "Never";
      }
    },
    flex: .75
  },
  {
    field: "Jobs@odata.count",
    filterField: "Jobs/$count",
    sortField: "Jobs/$count",
    expand: { navigationField: "Jobs", top: 0, count: true },
    filterOperators: numericOperators,
    headerName: "Number of jobs posted",
    type: "number",
    flex: .5
  },
  {
    field: "CompanyCategories",
    headerName: "Categories",
    label: "Category",
    expand: {
      navigationField: "CompanyCategories/Category",
      select: "Name"
    },
    sortable: false,
    flex: 1,
    hide: { xs: true, xl: false },
    renderCustomFilter: (value, setValue) => (
      <Grid item container alignSelf="center" xs={12} md>
        <Categories
          fetchUrl="/api/companies/categories"
          categories={value ? value as Category[] : []}
          onCategoryAdd={(cats) => setValue(cats)}
          onCategoryRemove={(cats) => setValue(cats)}
          openByDefault
        >
          <Grid item>
            <Typography variant="body1">Is one of:</Typography>
          </Grid>
        </Categories>
      </Grid>
    ),
    getCustomFilterString: (_, value) =>
      value && (value as Category[]).length > 0 ?
        `CompanyCategories/any(x:x/CategoryId in (${(value as Category[]).map(c => c.id).join(", ")}))`
        : "",
    renderCell: (params) => params.row.CompanyCategories.map((c: any) => c["Category/Name"]).join(", "),
  },

  {
    field: "Recruiter",
    label: "Company Type",
    filterOnly: true,
    filterOperators: ["eq", "ne"],
    type: "singleSelect",
    valueOptions: [
      { label: "Employer", value: false },
      { label: "Recruiter", value: true }
    ],
  },
  {
    field: "Watched",
    label: "Company Watched",
    filterOnly: true,
    filterOperators: ["eq", "ne"],
    type: "boolean",
  },
  {
    field: "Blacklisted",
    label: "Company Blacklisted",
    filterOnly: true,
    filterOperators: ["eq", "ne"],
    type: "boolean",
  },
  {
    field: "Notes",
    filterOnly: true,
    filterOperators: ["contains"]
  }
];

const defaultSort: GridSortModel = [{ field: "Name", sort: "asc" }];

const Companies: FunctionComponent = (props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<SearchFilter>({ categories: [] });
  const [query, setQuery] = useState<[string, string | undefined][]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newCompany, setNewCompany] = useState<Company>({ name: "", location: "" });

  const { classes } = useStyles();
  const history = useHistory();

  const create = useCallback(async () => {
    const response = await fetch("/api/companies/create", {
      method: "POST",
      body: JSON.stringify(newCompany),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      history.push(`/company/${data}`);
    } else {
      console.error(`API request failed: POST /api/companies/create, HTTP ${response.status}`);
    }
  }, [newCompany, history])

  useEffect(() => {
    (async () => {
      const response = await fetch("api/companies/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data as Category[]);
      } else {
        console.error(`API request failed: /api/companies/categories, HTTP ${response.status}`);
      }
    })();
  }, []);

  const addCategory = useCallback((id: number) => {
    if (!filter.categories.includes(id)) {
      setFilter({...filter, categories: [...filter.categories, id]});
    }
  }, [filter]);

  const removeCategory = useCallback((id: number) => {
    if (filter.categories.includes(id)) {
      const newCategories = [...filter.categories].filter(c => c !== id);
      setFilter({...filter, categories: newCategories});
    }
  }, [filter]);

  return (
    <Grid container direction="column" spacing={2}>
      <Helmet>
        <title>Companies | JobHunt</title>
      </Helmet>

      <Grid item>
        <ODataGrid
          url="/api/odata/company"
          columns={columns}
          defaultSortModel={defaultSort}
          idField="Id"
          filterBuilderProps={{ localizationProviderProps: { dateAdapter: DateAdapter, locale: enGB } }}
          defaultPageSize={15}
        />
      </Grid>

      <Grid item container justifyContent="flex-end">
        <Fab color="secondary" aria-label="add" onClick={() => setDialogOpen(!dialogOpen)}>
          <Add/>
        </Fab>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Company</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(); }}>
          <DialogContent className={classes.dialog}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Name" value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} variant="outlined" fullWidth required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Location" value={newCompany.location} onChange={(e) => setNewCompany({...newCompany, location: e.target.value})} variant="outlined" fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Website" value={newCompany.website ?? ""} onChange={(e) => setNewCompany({...newCompany, website: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Glassdoor" value={newCompany.glassdoor ?? ""} onChange={(e) => setNewCompany({...newCompany, glassdoor: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
              <Grid item xs={12}>
                <TextField label="LinkedIn" value={newCompany.linkedin ?? ""} onChange={(e) => setNewCompany({...newCompany, linkedin: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Endole" value={newCompany.endole ?? ""} onChange={(e) => setNewCompany({...newCompany, endole: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={() => setDialogOpen(false)} type="reset">
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Grid>
  );
}

export default Companies;