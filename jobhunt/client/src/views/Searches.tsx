import React, { FunctionComponent, Fragment, useState, useCallback } from "react"
import { Button, Box, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Switch, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, InputAdornment } from "@material-ui/core";
import Grid from "components/Grid";
import { GridColDef } from "@mui/x-data-grid"
import { Helmet } from "react-helmet";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import Card from "components/Card";
import CardBody from "components/CardBody";
import CardHeader from "components/CardHeader";
import ApiDataGrid from "components/ApiDataGrid";
import { Link, useHistory } from "react-router-dom";
import { Add } from "@material-ui/icons";
import CountrySelector from "components/CountrySelector";
import { IndeedSupportedCountries } from "utils/constants";
import { useResponsive } from "utils/hooks";

const toggleEnabled = async (id: string) => {
  const response = await fetch(`/api/search/enable/${id}`, { method: "PATCH" });
  if (!response.ok) {
    console.error(`API request failed: /api/search/enable/${id}, HTTP ${response.status}`);
  }
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  dialog: {
    minWidth: "40em",
    maxWidth: "100%"
  }
}));

dayjs.extend(relativeTime);
const columns = (small: boolean | undefined): GridColDef[] => [
  { field: "id", hide: true },
  {
    field: "description",
    headerName: "Description",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/search/${params.id}`}>{params.value}</Link>)
    }
  },
  {
    field: "enabled",
    headerName: "Enabled",
    sortable: false,
    renderCell: (params) => (<Switch defaultChecked={params.row.enabled} onChange={(e) => {toggleEnabled(params.row.id)}}/>)
  },
  {
    field: "lastRun",
    headerName: "Last Run",
    flex: 1,
    sortable: false,
    hide: small,
    renderCell: (params) => {
      if (params.value === null) {
        return <Fragment>Never</Fragment>;
      }

      let date = dayjs(params.value as string);
      if (date.isBefore(dayjs().subtract(1, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        let failedTag = params.row.lastRunSuccess ? null : (<Chip label="Failed" color="default"/>);
        return (
          <Grid container spacing={1}>
            <Grid item>
              {date.fromNow()}
            </Grid>
            <Grid item>
              {failedTag}
            </Grid>
          </Grid>
        )
      }
    }
  }
];

type Search = {
  provider: string,
  query: string,
  country: string,
  location?: string,
  distance: number,
  maxAge?: number,
  jobType?: string,
  employerOnly: boolean
}

const Searches: FunctionComponent = (props) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newSearch, setNewSearch] = useState<Search>({ provider: "Indeed", query: "", country: "gb", employerOnly: false, distance: 15 });
  const history = useHistory();

  const create = useCallback(async () => {
    const response = await fetch("/api/search/create", {
      method: "POST",
      body: JSON.stringify(newSearch),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      history.push(`/search/${data}`);
    } else {
      console.error(`API request failed: POST /api/search/create, HTTP ${response.status}`);
    }
  }, [newSearch, history])

  const classes = useStyles();
  const r = useResponsive();
  const small = r({xs: true, md: false});

  return (
    <Container>
      <Helmet>
        <title>Searches | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
         <Typography variant="h4">Searches</Typography>
        </CardHeader>
        <CardBody>
          <ApiDataGrid
            url="/api/search"
            columns={columns(small)}
            disableColumnMenu
            disableColumnSelector
            disableSelectionOnClick
          />
          <Box mt={2}>
            <Grid container justify="flex-end">
              <Fab color="secondary" aria-label="add" onClick={() => setDialogOpen(!dialogOpen)}>
                <Add/>
              </Fab>
            </Grid>
          </Box>
        </CardBody>
      </Card>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Search</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(); }}>
          <DialogContent className={classes.dialog}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel id="add-provider-select-label">Source</InputLabel>
                  <Select
                    labelId="add-provider-select-label"
                    value={newSearch.provider}
                    onChange={(e) => setNewSearch({...newSearch, provider: e.target.value as string})}
                    label="Source"
                  >
                    <MenuItem value="Indeed">Indeed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Search Term" value={newSearch.query} onChange={(e) => setNewSearch({...newSearch, query: e.target.value})} variant="outlined" fullWidth required/>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Location" value={newSearch.location ?? ""} onChange={(e) => setNewSearch({...newSearch, location: e.target.value})} variant="outlined" fullWidth/>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography id="label-distance" gutterBottom>Distance (mi/km)</Typography>
                  <Slider
                    value={newSearch.distance}
                    onChange={(_, val) => setNewSearch({...newSearch, distance: val as number})}
                    step={5}
                    marks
                    min={0}
                    max={50}
                    valueLabelDisplay="auto"
                    aria-labelledby="label-distance"
                    disabled={!newSearch.location}
                  />
              </Grid>
              <Grid item xs={12}>
                <CountrySelector
                  value={newSearch.country}
                  onChange={(code: string) => setNewSearch({...newSearch, country: code})}
                  required
                  allowedCountries={newSearch.provider === "Indeed" ? IndeedSupportedCountries : undefined}
                  hideForbiddenCountries
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="add-type-select-label">Job Type</InputLabel>
                  <Select
                    labelId="add-type-select-label"
                    value={newSearch.jobType}
                    onChange={(e) => setNewSearch({...newSearch, jobType: e.target.value as string})}
                    label="Job Type"
                  >
                    <MenuItem><em>Any</em></MenuItem>
                    <MenuItem value="permanent">Permanent</MenuItem>
                    <MenuItem value="fulltime">Full-time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="apprenticeship">Apprenticeship</MenuItem>
                    <MenuItem value="temporary">Temporary</MenuItem>
                    <MenuItem value="parttime">Part-time</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Maximum Age"
                  value={newSearch.maxAge ?? ""}
                  onChange={(e) => setNewSearch({...newSearch, maxAge: isNaN(parseInt(e.target.value, 10)) ? undefined : parseInt(e.target.value, 10)})}
                  variant="outlined"
                  fullWidth
                  InputProps={{endAdornment: <InputAdornment position="end">days</InputAdornment>}}
                />
              </Grid>
              <Grid item xs={12} alignItems="center">
                <FormControlLabel
                  style={{height: "100%"}}
                  control={<Switch checked={!newSearch.employerOnly} onChange={(e) => setNewSearch({...newSearch, employerOnly: !e.target.checked})} color="primary" />}
                  label="Include jobs from recruiters"
                />
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

export default Searches;