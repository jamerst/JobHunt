import React, { FunctionComponent, Fragment, useEffect, useState, useCallback, useRef } from "react"
import { Button, Chip, Slider, TextField, Tooltip, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Link } from "@mui/material";
import Grid from "components/Grid";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import { GridRowParams, GridSortModel } from "@mui/x-data-grid"
import Autocomplete from '@mui/material/Autocomplete';
import { Add, Visibility } from "@mui/icons-material";
import { ODataGridColDef, ODataColumnVisibilityModel, escapeODataString } from "o-data-grid";
import ODataGrid from "components/ODataGrid";

import makeStyles from "makeStyles";

import { useNavigate } from "react-router";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"
import enGB from "dayjs/locale/en-gb"

import { LocationFilter } from "types";
import Categories, { Category } from "components/Categories";
import HideOnScroll from "components/HideOnScroll";

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
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

dayjs.extend(relativeTime);
dayjs.extend(utc);

const alwaysSelect = ["Id", "Archived"];
const columns: ODataGridColDef[] = [
  {
    field: "Title",
    select: "Title,DuplicateJobId",
    headerName: "Job Title",
    flex: 2,
    renderCell: (params) => <Link component={RouterLink} to={`/job/${params.id}`}>
      <Grid container spacing={1} alignItems="center" wrap="nowrap">
        <Grid item>{params.value}</Grid>
        {params.row.DuplicateJobId && <Grid item><Chip sx={{ cursor: "pointer" }} label="Duplicate" size="small" /></Grid>}
      </Grid>

    </Link>,
    autocompleteGroup: "Job"
  },
  {
    field: "DuplicateJob/Title",
    select: "DuplicateJobId",
    expand: {
      navigationField: "DuplicateJob",
      select: "Title"
    },
    headerName: "Duplicate Job",
    flex: 1.5,
    renderCell: (params) => <Link component={RouterLink} to={`/job/${params.row.DuplicateJobId}`}>{params.value}</Link>,
    filterOperators: ["eq", "ne"],
    filterType: "boolean",
    autocompleteGroup: "Job",
    getCustomFilterString: (_, value) => value === "true" ? "DuplicateJobId ne null" : "DuplicateJobId eq null"
  },
  {
    field: "Location",
    headerName: "Location",
    flex: 1,
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
    getCustomFilterString: (_, v) => {
      const filter = v as LocationFilter;
      return {
        filter: `Latitude ne null and Longitude ne null and Distance le ${filter.distance ?? 15}`,
        compute: {
          compute: `geocode('${escapeODataString(filter.location ?? "")}', Latitude, Longitude) as Distance`,
          select: ["Distance"]
        }
      };
    },
    valueGetter: (params) => `${params.row.Location}${params.row.Distance ? ` (${params.row.Distance.toFixed(1)}mi away)` : ""}`,
    autocompleteGroup: "Job"
  },
  {
    field: "Company/Name",
    headerName: "Company",
    flex: 2,
    renderCell: (params) => (
      <Link
        component={RouterLink}
        to={`/company/${params.row["Company/Id"]}`}
      >
        <Grid container spacing={1} alignItems="center" wrap="nowrap">
          <Grid item>
            {params.value}
          </Grid>
          {params.row["Company/Recruiter"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Recruiter" size="small" /></Grid>}
          {params.row["Company/Blacklisted"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Blacklisted" size="small" color="error" /></Grid>}
          {params.row["Company/Watched"] && <Grid item sx={{ display: "flex", alignItems: "center" }}><Visibility fontSize="small" /></Grid>}
        </Grid>
      </Link>
    ),
    expand: { navigationField: "Company", select: "Id,Name,Recruiter,Blacklisted,Watched" },
    autocompleteGroup: "Company"
  },
  {
    field: "Salary",
    type: "number",
    filterField: "AvgYearlySalary",
    sortField: "AvgYearlySalary",
    label: "Median Annual Salary",
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
    valueGetter: (params) => params.row[params.field] ? params.row[params.field] : "Added Manually",
    autocompleteGroup: "Job"
  },
  {
    field: "Posted",
    select: "Posted,Seen,Archived",
    headerName: "Posted",
    type: "date",
    flex: .9,
    renderCell: (params) => {
      let date = dayjs.utc(params.value as string);
      let dateComponent;
      let chip;

      if (params.row.Seen === false) {
        chip = (<Chip label="New" color="secondary" />);
      }

      if (params.row.Archived === true) {
        chip = (<Chip label="Archived" />);
      }

      if (date.isBefore(dayjs.utc().subtract(14, "day"), "day")) {
        dateComponent = (<Fragment>{date.local().format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        dateComponent = (
          <Tooltip
            title={<Typography variant="body2">{date.local().format("DD/MM/YYYY HH:mm")}</Typography>}
            placement="right"
          >
            <span>{date.fromNow()}</span>
          </Tooltip>
        );
      }

      return (
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>{dateComponent}</Grid>
          <Grid item>{chip}</Grid>
        </Grid>
      )
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

const columnVisibility: ODataColumnVisibilityModel = {
  "Company/Name": { xs: false, md: true },
  "DuplicateJob/Title": false,
  "Salary": { xs: false, lg: true },
  "Status": false,
  "JobCategories": { xs: false, xl: true },
  "Source/DisplayName": false,
  "Posted": { xs: false, sm: true },
}

const defaultSort: GridSortModel = [{ field: "Posted", sort: "desc" }];

const Jobs: FunctionComponent = (props) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newJob, setNewJob] = useState<Job>({ title: "" });
  const [companies, setCompanies] = useState<Company[]>([]);
  const companiesFetched = useRef(false);

  const navigate = useNavigate();

  const { classes } = useStyles();

  const create = useCallback(async (job: Job) => {
    const response = await fetch("/api/jobs/create", {
      method: "POST",
      body: JSON.stringify(job),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      navigate(`/job/${data}`);
    } else {
      console.error(`API request failed: POST /api/jobs/create, HTTP ${response.status}`);
    }
  }, [navigate]);

  const getClass = useCallback((params: GridRowParams) => params.row.Archived ? classes.archived : params.row.Seen ? "" : classes.unseen, [classes]);

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
    <div>
      <Helmet>
        <title>Jobs | JobHunt</title>
      </Helmet>

      <ODataGrid
        url="/api/odata/Job"
        columns={columns}
        columnVisibilityModel={columnVisibility}
        getRowId={(row) => row["Id"]}
        alwaysSelect={alwaysSelect}
        defaultSortModel={defaultSort}
        getRowClassName={getClass}
        filterBuilderProps={{ localizationProviderProps: { dateAdapter: AdapterDayjs, locale: enGB }, autocompleteGroups: ["Job", "Company"] }}
        defaultPageSize={15}
      />

      <HideOnScroll>
        <Fab className={classes.fab} color="secondary" aria-label="add" onClick={() => { setDialogOpen(!dialogOpen); }}>
          <Add/>
        </Fab>
      </HideOnScroll>

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
                <LocalizationProvider dateAdapter={AdapterDayjs} locale={enGB}>
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
    </div>
  );
}

export default Jobs;