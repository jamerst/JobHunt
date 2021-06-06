import React, { FunctionComponent, useEffect, useState, useCallback, Fragment } from "react"
import { Box, Button, Chip, Container, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Slider, Switch, TextField, Tooltip, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@material-ui/core";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { GridColDef } from "@material-ui/data-grid"
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Helmet } from "react-helmet";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Add } from "@material-ui/icons";
import { Link, useHistory } from "react-router-dom";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import DayjsUtils from "../utils/dayjs-utils"

import Card from "../components/Card";
import CardBody from "../components/CardBody";
import CardHeader from "../components/CardHeader";
import ApiDataGrid from "../components/ApiDataGrid";
import { useResponsive } from "../utils/hooks";

type SearchFilter = {
  term?: string,
  location?: string,
  distance?: number,
  posted?: Date,
  categories: number[],
  status?: string,
  showArchived: boolean
}

const toQuery = (f: SearchFilter) =>  {
  let result:[string, string | undefined][] = [
    ["term", f.term],
    ["location", f.location],
    ["distance", f.distance?.toString()],
    ["posted", f.posted?.toISOString()],
    ["status", f.status],
    ["showArchived", String(f.showArchived)]
  ]

  f.categories.forEach(c => result.push(["categories", c.toString()]))
  return result;
};

type Category = {
  id: number,
  name: string
}

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

const useStyles = makeStyles((theme: Theme) => createStyles({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  archived: {
    fontStyle: "italic"
  },
  dialog: {
    minWidth: "40em",
    maxWidth: "100%",
    [theme.breakpoints.down("sm")]: {
      minWidth: 0
    }
  }
}));

dayjs.extend(relativeTime);
const jobsColumns = (small: boolean | undefined): GridColDef[] => [
  { field: "id", hide: true },
  {
    field: "title",
    headerName: "Job Title",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/job/${params.id}`}>{params.value}</Link>)
    }
  },
  {
    field: "location",
    headerName: "Location",
    flex: 1,
    sortable: false,
    valueGetter: (params) => params.row.distance ? `${params.value} (${(params.row.distance as number).toFixed(1)}mi away)` : params.value
  },
  {
    field: "companyName",
    headerName: "Company",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/company/${params.row.companyId}`}>{params.value}</Link>)
    },
    hide: small
  },
  {
    field: "posted",
    headerName: "Posted",
    type: "datetime",
    flex: 1.25,
    sortable: false,
    hide: small,
    renderCell: (params) => {
      let date = dayjs(params.value as string);
      if (date.isBefore(dayjs().subtract(14, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        let newTag = !params.row.seen && !params.row.archived ? (<Chip label="New" color="secondary"/>) : null;
        return (
          <Grid container justify="space-between" alignItems="center">
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
    }
  }
];

const Jobs: FunctionComponent = (props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<SearchFilter>({ categories: [], showArchived: false });
  const [query, setQuery] = useState<[string, string | undefined][]>(toQuery(filter));
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newJob, setNewJob] = useState<Job>({ title: "" });
  const [companies, setCompanies] = useState<Company[]>([]);

  const history = useHistory();
  const r = useResponsive();
  const small = r({xs: true, md: false});

  const create = useCallback(async () => {
    const response = await fetch("/api/jobs/create", {
      method: "POST",
      body: JSON.stringify(newJob),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      history.push(`/job/${data}`);
    } else {
      console.error(`API request failed: POST /api/jobs/create, HTTP ${response.status}`);
    }
  }, [newJob, history]);

  const fetchCompanies = useCallback(async () => {
    if (companies.length > 0) {
      return;
    }

    const response = await fetch("/api/companies/names");
    if (response.ok) {
      const data = await response.json();
      setCompanies(data as Company[]);
    } else {
      console.error(`API request failed: GET /api/companies/names, HTTP ${response.status}`);
    }
  }, [companies]);

  const classes = useStyles();

  useEffect(() => {
    (async () => {
      const response = await fetch("api/jobs/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data as Category[]);
      } else {
        console.error(`API request failed: /api/jobs/categories, HTTP ${response.status}`);
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
    <Container>
      <Helmet>
        <title>Jobs | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
         <Typography variant="h4">Saved Jobs</Typography>
        </CardHeader>
        <CardBody>
          <Box mx={r({xs: 1, md: 8})} mb={4} mt={1}>
            <form onSubmit={(e) => { e.preventDefault(); setQuery(toQuery(filter)); }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField variant="filled" label="Search Term" fullWidth size="small" value={filter.term ?? ""} onChange={(e) => setFilter({...filter, term: e.target.value})} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <MuiPickersUtilsProvider utils={DayjsUtils}>
                    <KeyboardDatePicker
                      label="Posted After"
                      value={filter.posted ?? null}
                      onChange={(date) => setFilter({...filter, posted: date?.toDate()})}
                      variant="inline"
                      inputVariant="filled"
                      format="DD/MM/YYYY"
                      disableFuture
                      autoOk
                      fullWidth
                      size="small"
                    />
                  </MuiPickersUtilsProvider>
                </Grid>
                <Grid item xs={12} md={4}>
                <TextField
                    variant="filled"
                    label="Location"
                    fullWidth
                    size="small"
                    value={filter.location ?? ""}
                    onChange={(e) => {
                      let distance = filter.distance;
                      if (e.target.value && !filter.distance) {
                        distance = 15;
                      } else if (!e.target.value) {
                        distance = undefined;
                      }
                      setFilter({...filter, location: e.target.value, distance: distance});
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography id="label-distance" gutterBottom>Distance</Typography>
                  <Slider
                    value={filter.distance ?? 15}
                    onChange={(_, val) => setFilter({...filter, distance: val as number})}
                    step={5}
                    marks
                    min={0}
                    max={50}
                    valueLabelFormat={(val) => `${val}mi`}
                    valueLabelDisplay="auto"
                    aria-labelledby="label-distance"
                    disabled={!filter.location}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="filled">
                    <InputLabel id="label-status">Status</InputLabel>
                    <Select
                      value={filter.status}
                      onChange={(e) => setFilter({...filter, status: e.target.value as string})}
                      labelId="label-status"
                    >
                      <MenuItem><em>Any</em></MenuItem>
                      <MenuItem value="Not Applied">Not Applied</MenuItem>
                      <MenuItem value="Awaiting Response">Awaiting Response</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item container xs={12} spacing={1}>
                  {categories.map(c => (
                    <Grid item key={`category-selector-${c.id}`}>
                      <Chip
                        label={c.name}
                        onClick={() => addCategory(c.id)}
                        onDelete={filter.categories.includes(c.id) ? () => removeCategory(c.id) : undefined}
                        color={filter.categories.includes(c.id) ? "primary" : "default"}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Grid item container xs={12} spacing={2}>
                  <Grid item>
                    <Button variant="contained" color="secondary" type="submit">Search</Button>
                  </Grid>
                  <Grid item>
                    <FormControlLabel
                      control={<Switch checked={filter.showArchived} onChange={(e) => setFilter({...filter, showArchived: e.target.checked})} />}
                      label="Show Archived"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </Box>
          <Box mx={r({xs: 1, md: 4})}>
            <ApiDataGrid
              url="/api/jobs/search"
              columns={jobsColumns(small)}
              disableColumnMenu
              disableColumnSelector
              getRowClassName={(params) => params.row.archived ? classes.archived : params.row.seen ? "" : classes.unseen}
              queryParams={query}
              alwaysUpdateCount
              disableSelectionOnClick
            />
          </Box>
          <Box mt={2}>
            <Grid container justify="flex-end">
              <Fab color="secondary" aria-label="add" onClick={() => { fetchCompanies(); setDialogOpen(!dialogOpen); }}>
                <Add/>
              </Fab>
            </Grid>
          </Box>
        </CardBody>
      </Card>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Job</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(); }}>
          <DialogContent className={classes.dialog}>
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
                <MuiPickersUtilsProvider utils={DayjsUtils}>
                    <KeyboardDatePicker
                      label="Posted"
                      value={newJob.posted ?? null}
                      onChange={(date) => setNewJob({...newJob, posted: date?.toDate()})}
                      variant="inline"
                      inputVariant="outlined"
                      format="DD/MM/YYYY"
                      disableFuture
                      autoOk
                      fullWidth
                    />
                  </MuiPickersUtilsProvider>
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
    </Container>
  );
}

export default Jobs;