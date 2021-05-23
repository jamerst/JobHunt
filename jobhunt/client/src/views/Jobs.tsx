import React, { FunctionComponent, useEffect, useState, useCallback, Fragment } from "react"
import { Box, Button, Chip, Container, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Slider, Switch, TextField, Tooltip, Typography } from "@material-ui/core";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { GridColDef } from "@material-ui/data-grid"
import { Helmet } from "react-helmet";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import DayjsUtils from "../utils/dayjs-utils"

import Card from "../components/Card";
import CardBody from "../components/CardBody";
import CardHeader from "../components/CardHeader";
import ApiDataGrid from "../components/ApiDataGrid";
import { Link } from "react-router-dom";

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

const useStyles = makeStyles((theme: Theme) => createStyles({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  archived: {
    fontStyle: "italic"
  }
}));

dayjs.extend(relativeTime);
const jobsColumns: GridColDef[] = [
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
    }
  },
  {
    field: "posted",
    headerName: "Posted",
    type: "datetime",
    flex: 1.25,
    sortable: false,
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
          <Box mx={8} mb={4}>
            <Grid container spacing={2}>
              <Grid item md={8}>
                <TextField variant="filled" label="Search Term" fullWidth size="small" value={filter.term ?? ""} onChange={(e) => setFilter({...filter, term: e.target.value})}/>
              </Grid>
              <Grid item md={4}>
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
              <Grid item md={4}>
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
              <Grid item md={4}>
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
              <Grid item md={4}>
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
              <Grid item container md={12} spacing={1}>
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
              <Grid item container md={12} spacing={2}>
                <Grid item>
                  <Button variant="contained" color="secondary" onClick={() => setQuery(toQuery(filter))}>Search</Button>
                </Grid>
                <Grid item>
                  <FormControlLabel
                    control={<Switch checked={filter.showArchived} onChange={(e) => setFilter({...filter, showArchived: e.target.checked})} />}
                    label="Show Archived"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Box>
          <Box mx={4}>
            <ApiDataGrid
              url="/api/jobs/search"
              columns={jobsColumns}
              disableColumnMenu
              disableColumnSelector
              getRowClassName={(params) => params.row.archived ? classes.archived : params.row.seen ? "" : classes.unseen}
              queryParams={query}
              alwaysUpdateCount
              disableSelectionOnClick
            />
          </Box>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Jobs;