import React, { FunctionComponent, useState, useCallback } from "react"
import {  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Link, Typography, Slider, Chip } from "@mui/material";
import Grid from "components/Grid";
import { GridSortModel } from "@mui/x-data-grid"
import DateAdapter from "@mui/lab/AdapterDayjs";
import { Add, Visibility } from "@mui/icons-material";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router";
import { Link as RouterLink } from "react-router-dom";
import { ODataGridColDef, QueryStringCollection, numericOperators, ODataColumnVisibilityModel } from "o-data-grid";
import ODataGrid from "components/ODataGrid";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"
import enGB from "dayjs/locale/en-gb"

import makeStyles from "makeStyles";
import { LocationFilter } from "types";
import Categories, { Category } from "components/Categories";
import HideOnScroll from "components/HideOnScroll";

type JobResult = {
  Posted: string,
  AvgYearlySalary: number
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
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

dayjs.extend(relativeTime);
dayjs.extend(utc);

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
})

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
        <Grid container spacing={1} alignItems="center" wrap="nowrap">
          <Grid item>
            {params.value}
          </Grid>
          {params.row["Recruiter"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Recruiter" size="small" /></Grid>}
          {params.row["Blacklisted"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Blacklisted" size="small" color="error" /></Grid>}
          {params.row["Watched"] && <Grid item sx={{ display: "flex", alignItems: "center" }}><Visibility fontSize="small" /></Grid>}
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
    // This field has to be calculated clientside - $apply doesn't appear to work for collections
    field: "AvgSalary",
    headerName: "Average Salary",
    expand: { navigationField: "Jobs", select: "AvgYearlySalary" },
    type: "number",
    filterable: false,
    sortable: false,
    valueGetter: (params) => {
      const jobs = (params.row["Jobs"] as JobResult[]).filter(j => j.AvgYearlySalary);
      if (jobs && jobs.length > 0) {
        return currencyFormatter.format(jobs.map(j => j.AvgYearlySalary).reduce((a, b) => a + b) / jobs.length);
      } else {
        return "";
      }
    },
    flex: .5
  },
  {
    field: "Jobs@odata.count",
    filterField: "Jobs/$count",
    sortField: "Jobs/$count",
    expand: { navigationField: "Jobs", top: 0, count: true },
    filterOperators: numericOperators,
    headerName: "Jobs Posted",
    type: "number",
    flex: .5
  },
  {
    field: "LatestJob",
    headerName: "Latest Job Posted",
    expand: { navigationField: "Jobs", select: "Posted", orderBy: "Posted desc" },
    type: "datetime",
    filterable: false,
    sortable: false,
    renderCell: (params) => {
      const jobs = params.row["Jobs"] as JobResult[];
      if (jobs && jobs.length > 0) {
        return dayjs(jobs[0].Posted).format("DD/MM/YYYY HH:mm");
      } else {
        return "";
      }
    },
    flex: .5
  },
  {
    field: "LatestPageUpdate",
    headerName: "Latest Page Updated",
    expand: { navigationField: "WatchedPages", select: "LastUpdated", orderBy: "LastUpdated desc" },
    filterable: false,
    sortable: false,
    type: "datetime",
    flex: .5,
    renderCell: (params) => {
      const pages = params.row["WatchedPages"] as ({ LastUpdated: string })[];
      if (pages && pages.length > 0) {
        return dayjs(pages[0].LastUpdated).format("DD/MM/YYYY HH:mm");
      } else {
        return "";
      }
    }
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

const columnVisibility: ODataColumnVisibilityModel = {
  "AvgSalary": { xs: false, xl: true },
  "Jobs@odata.count": { xs: false, md: true },
  "LatestJob": { xs: false, md: true },
  "LatestPageUpdate": { xs: false, xl: true },
  "CompanyCategories": { xs: false, xxl: true },
}

const defaultSort: GridSortModel = [{ field: "Name", sort: "asc" }];

const alwaysSelect = ["Id"];

const Companies: FunctionComponent = (props) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newCompany, setNewCompany] = useState<Company>({ name: "", location: "" });

  const { classes } = useStyles();
  const navigate = useNavigate();

  const create = useCallback(async () => {
    const response = await fetch("/api/companies/create", {
      method: "POST",
      body: JSON.stringify(newCompany),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      navigate(`/company/${data}`);
    } else {
      console.error(`API request failed: POST /api/companies/create, HTTP ${response.status}`);
    }
  }, [newCompany, navigate])

  return (
    <div>
      <Helmet>
        <title>Companies | JobHunt</title>
      </Helmet>

      <ODataGrid
        url="/api/odata/company"
        columns={columns}
        columnVisibilityModel={columnVisibility}
        getRowId={(row) => row["Id"]}
        alwaysSelect={alwaysSelect}
        defaultSortModel={defaultSort}
        filterBuilderProps={{ localizationProviderProps: { dateAdapter: DateAdapter, locale: enGB } }}
        defaultPageSize={15}
      />

      <HideOnScroll>
        <Fab color="secondary" className={classes.fab} aria-label="add" onClick={() => setDialogOpen(!dialogOpen)}>
          <Add/>
        </Fab>
      </HideOnScroll>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Company</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(); }}>
          <DialogContent>
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
    </div>
  );
}

export default Companies;