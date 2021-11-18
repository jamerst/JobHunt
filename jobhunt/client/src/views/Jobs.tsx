import React, { FunctionComponent, useEffect, useState, useCallback, Fragment, useRef } from "react"
import { Button, Chip, Slider, TextField, Tooltip, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Link } from "@mui/material";
import Grid from "components/Grid";
import { DatePicker } from "@mui/lab";
import DateAdapter from "@mui/lab/AdapterDayjs";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import { GridSortModel } from "@mui/x-data-grid"
import Autocomplete from '@mui/material/Autocomplete';
import { Add } from "@mui/icons-material";

import makeStyles from "makeStyles";

import { Link as RouterLink, useHistory } from "react-router-dom";
import { Helmet } from "react-helmet";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"
import enGB from "dayjs/locale/en-gb"

import { LocationFilter } from "types";
import Categories, { Category } from "components/Categories";
import { ODataGrid, ODataGridColDef } from "o-data-grid";
import { QueryStringCollection } from "o-data-grid/FilterBuilder/types";

type Job = {
  company?: Company | null,
  companyId?: number,
  title: string,
  location?: string,
  salary?: string,
  avgYearlySalary?: number,
  description?: string,
  url?: string,
  posted?: Date
}

type Company = {
  companyId: number,
  name: string
}

const useStyles = makeStyles()((theme) => ({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  archived: {
    fontStyle: "italic"
  }
}));

dayjs.extend(relativeTime);
dayjs.extend(utc);

const columns: ODataGridColDef[] = [
  {
    field: "Title",
    headerName: "Job Title",
    flex: 2,
    renderCell: (params) => {
      return (<Link component={RouterLink} to={`/job/${params.id}`}>{params.value}</Link>)
    },
    autocompleteGroup: "Job"
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
    autocompleteGroup: "Job"
  },
  {
    field: "Company/Name",
    headerName: "Company",
    hide: { xs: true, md: false },
    flex: 2,
    renderCell: (params) => (
      <Link
        component={RouterLink}
        to={`/company/${params.row["Company/Id"]}`}
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
    ),
    expand: { navigationField: "Company", select: "Id,Name,Recruiter,Blacklisted,Watched" },
    autocompleteGroup: "Company"
  },
  {
    field: "Salary",
    hide: { xs: true, lg: false },
    filterField: "AvgYearlySalary",
    sortField: "AvgYearlySalary",
    label: "Median Yearly Salary",
    filterType: "number",
    filterOperators: ["eq", "ne", "gt", "lt", "ge", "le", "null", "notnull"],
    flex: 1,
    autocompleteGroup: "Job"
  },
  {
    field: "Status",
    type: "singleSelect",
    valueOptions: ["Not Applied", "Awaiting Response", "In Progress", "Rejected", "Dropped Out"],
    filterOperators: ["eq", "ne"],
    hide: true,
    autocompleteGroup: "Job"
  },
  {
    field: "JobCategories",
    headerName: "Categories",
    label: "Category",
    expand: {
      navigationField: "JobCategories/Category",
      select: "Name"
    },
    sortable: false,
    flex: 1,
    hide: { xs: true, xl: false },
    renderCustomFilter: (value, setValue) => (
      <Grid item container alignSelf="center" xs={12} md>
        <Categories
          fetchUrl="/api/jobs/categories"
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
        `JobCategories/any(x:x/CategoryId in (${(value as Category[]).map(c => c.id).join(", ")}))`
        : "",
    renderCell: (params) => params.row.JobCategories.map((c: any) => c["Category/Name"]).join(", "),
    autocompleteGroup: "Job"
  },
  {
    field: "Source/DisplayName",
    expand: { navigationField: "Source", select: "DisplayName" },
    headerName: "Source",
    filterable: false,
    sortable: false,
    flex: 1,
    hide: true,
    valueGetter: (params) => params.value ? params.value : "Added Manually",
    autocompleteGroup: "Job"
  },
  {
    field: "Posted",
    select: "Posted,Seen",
    headerName: "Posted",
    hide: { xs: true, sm: false },
    type: "date",
    flex: .9,
    renderCell: (params) => {
      let date = dayjs(params.value as string);
      if (date.isBefore(dayjs().subtract(14, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        let newTag = params.row.seen ? null : (<Chip label="New" color="secondary" />);
        return (
          <Grid container justifyContent="space-between" alignItems="center">
            <Tooltip
              title={<Typography variant="body2">{date.format("DD/MM/YYYY HH:mm")}</Typography>}
              placement="right"
            >
              <span>{date.fromNow()}</span>
            </Tooltip>
            {newTag}
          </Grid>
        );
      }
    },
    autocompleteGroup: "Job"
  },

  // filter only
  {
    field: "Company/Recruiter",
    label: "Company Type",
    filterOnly: true,
    filterOperators: ["eq", "ne"],
    type: "singleSelect",
    valueOptions: [
      { label: "Employer", value: false },
      { label: "Recruiter", value: true }
    ],
    autocompleteGroup: "Company"
  },
  {
    field: "Company/Watched",
    label: "Company Watched",
    filterOnly: true,
    filterOperators: ["eq", "ne"],
    type: "boolean",
    autocompleteGroup: "Company"
  },
  {
    field: "Company/Blacklisted",
    label: "Company Blacklisted",
    filterOnly: true,
    filterOperators: ["eq", "ne"],
    type: "boolean",
    autocompleteGroup: "Company"
  },
  {
    field: "Description",
    filterOnly: true,
    filterOperators: ["contains"],
    autocompleteGroup: "Job"
  },
  {
    field: "Notes",
    filterOnly: true,
    filterOperators: ["contains"],
    autocompleteGroup: "Job"
  }
];

const defaultSort: GridSortModel = [{ field: "Posted", sort: "desc" }];

const Jobs: FunctionComponent = (props) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newJob, setNewJob] = useState<Job>({ title: "" });
  const [companies, setCompanies] = useState<Company[]>([]);
  const companiesFetched = useRef(false);

  const history = useHistory();

  const { classes } = useStyles();

  const create = useCallback(async (job: Job) => {
    const response = await fetch("/api/jobs/create", {
      method: "POST",
      body: JSON.stringify(job),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      history.push(`/job/${data}`);
    } else {
      console.error(`API request failed: POST /api/jobs/create, HTTP ${response.status}`);
    }
  }, [history]);

  useEffect(() => {
    if (companiesFetched.current) {
      return;
    }

    const fetchCompanies = async () => {
      const response = await fetch("/api/companies/names");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data as Company[]);
        companiesFetched.current = true;
      } else {
        console.error(`API request failed: GET /api/companies/names, HTTP ${response.status}`);
      }
    }

    fetchCompanies();
  }, [dialogOpen]);

  return (
    <Grid container direction="column" spacing={2}>
      <Helmet>
        <title>Jobs | JobHunt</title>
      </Helmet>

      <Grid item>
        <ODataGrid
          url="/api/odata/job"
          columns={columns}
          getRowClassName={(params) => params.row.seen ? "" : classes.unseen}
          idField="Id"
          defaultSortModel={defaultSort}
          filterBuilderProps={{ localizationProviderProps: { dateAdapter: DateAdapter, locale: enGB }, autocompleteGroups: ["Job", "Company"] }}
          defaultPageSize={15}
        />
      </Grid>

      <Grid item container xs justifyContent="flex-end">
        <Grid item>
          <Fab color="secondary" aria-label="add" onClick={() => { setDialogOpen(!dialogOpen); }}>
            <Add/>
          </Fab>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Job</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(newJob); }}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Title" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} variant="outlined" fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={companies}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => <TextField {...params} label="Company" variant="outlined" />}
                  fullWidth
                  value={newJob.company}
                  onChange={(_, val) => setNewJob({...newJob, company: val, companyId: val?.companyId})}
                />

              </Grid>
              <Grid item xs={12}>
                <TextField label="Location" value={newJob.location ?? ""} onChange={(e) => setNewJob({...newJob, location: e.target.value})} variant="outlined" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Salary" value={newJob.salary ?? ""} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} variant="outlined" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Yearly Salary"
                  value={newJob.avgYearlySalary ?? ""}
                  onChange={(e) => setNewJob({...newJob, avgYearlySalary: isNaN(parseInt(e.target.value, 10)) ? undefined : parseInt(e.target.value, 10)})}
                  variant="outlined"
                  fullWidth
                  type="number"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description (HTML)" value={newJob.description ?? ""} onChange={(e) => setNewJob({...newJob, description: e.target.value})} variant="outlined" fullWidth multiline rows={10} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="URL" value={newJob.url ?? ""} onChange={(e) => setNewJob({...newJob, url: e.target.value})} variant="outlined" fullWidth/>
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={DateAdapter} locale={enGB}>
                  <DatePicker
                    label="Posted"
                    value={newJob.posted ?? null}
                    renderInput={(params) => (<TextField {...params} variant="outlined" fullWidth />)}
                    onChange={(date) => setNewJob({ ...newJob, posted: date as Date }) }
                    disableFuture
                  />
                </LocalizationProvider>
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

export default Jobs;