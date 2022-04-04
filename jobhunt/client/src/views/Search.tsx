import React, { useCallback, useEffect, useState } from "react"
import { Container, Typography, FormControl, InputLabel, TextField, Select, MenuItem, Slider, InputAdornment, FormControlLabel, Switch, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from "@mui/material";
import { Delete, Save } from "@mui/icons-material";

import { useParams } from "react-router"
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import dayjs from "dayjs"

import Card from "components/Card";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";
import CountrySelector from "components/CountrySelector";
import Grid from "components/Grid";
import Tabs from "components/Tabs";
import Tab from "components/Tab";

import { IndeedSupportedCountries } from "utils/constants"


type SearchResponse = {
  id: number,
  provider: string,
  query: string,
  country: string,
  location?: string,
  distance?: number,
  maxAge?: number,
  jobType?: string,
  employerOnly: boolean,
  runs: SearchRun[],
  description: string,
  enabled: boolean
}

type SearchRun = {
  id: number,
  time: string,
  success: boolean,
  message?: string,
  newJobs: number,
  newCompanies: number,
  timeTaken: number
}

const Search = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState<SearchResponse>();
  const [origSearch, setOrigSearch] = useState<SearchResponse>();
  const [edited, setEdited] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/search/${id}`);
    if (response.ok) {
      const data = await response.json();
      setSearch(data as SearchResponse);
      setOrigSearch(data as SearchResponse);
    } else {
      console.error(`API request failed: GET /api/search/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  const saveChanges = useCallback(async () => {
    const response = await fetch(`/api/search/${id}`, {
      method: "PATCH",
      body: JSON.stringify(search),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      setOrigSearch(search);
    } else {
      console.error(`API request failed: PATCH /api/search/${id}, HTTP ${response.status}`);
      setSearch(origSearch);
    }
    setEdited(false);
  }, [search, origSearch, id]);

  const remove = useCallback(async () => {
    const response = await fetch(`/api/search/${id}`, { method: "DELETE" });
    if (response.ok) {
      navigate("/searches");
    } else {
      console.error(`API request failed: DELETE /api/search/${id}, HTTP ${response.status}`);
    }
  }, [id, navigate])

  useEffect(() => {
    fetchData();
  }, [fetchData])

  if (!search) return null;

  return (
    <Container>
      <Helmet>
        <title>{search.description} | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
          <Typography variant="h5">{search.description}</Typography>
        </CardHeader>
        <CardBody>
          <Tabs labels={["Details", "Runs"]}>
            <Tab>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" required>
                    <InputLabel id="add-provider-select-label">Source</InputLabel>
                    <Select
                      labelId="add-provider-select-label"
                      value={search.provider}
                      onChange={(e) => setSearch({...search, provider: e.target.value as string})}
                      label="Source"
                    >
                      <MenuItem value="Indeed">Indeed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Search Term" value={search.query} onChange={(e) => { setEdited(true); setSearch({...search, query: e.target.value}); }} variant="outlined" fullWidth required/>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Location" value={search.location ?? ""} onChange={(e) => { setEdited(true); setSearch({...search, location: e.target.value}); }} variant="outlined" fullWidth/>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography id="label-distance" gutterBottom>Distance (mi/km)</Typography>
                    <Slider
                      value={search.distance ?? 15}
                      onChange={(_, val) => { setEdited(true); setSearch({...search, distance: val as number}); }}
                      step={5}
                      marks
                      min={0}
                      max={50}
                      valueLabelDisplay="auto"
                      aria-labelledby="label-distance"
                      disabled={!search.location}
                    />
                </Grid>
                <Grid item xs={12}>
                  <CountrySelector
                    value={search.country}
                    onChange={(code: string) => { setEdited(true); setSearch({...search, country: code}); }}
                    required
                    allowedCountries={search.provider === "Indeed" ? IndeedSupportedCountries : undefined}
                    hideForbiddenCountries
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="add-type-select-label">Job Type</InputLabel>
                    <Select
                      labelId="add-type-select-label"
                      value={search.jobType ?? ""}
                      onChange={(e) => { setEdited(true); setSearch({...search, jobType: e.target.value as string}); }}
                      label="Job Type"
                    >
                      <MenuItem value=""><em>Any</em></MenuItem>
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
                    value={search.maxAge ?? ""}
                    onChange={(e) => { setEdited(true); setSearch({...search, maxAge: isNaN(parseInt(e.target.value, 10)) ? undefined : parseInt(e.target.value, 10)}); }}
                    variant="outlined"
                    fullWidth
                    InputProps={{endAdornment: <InputAdornment position="end">days</InputAdornment>}}
                  />
                </Grid>
                <Grid item container direction="column">
                  <Grid item>
                    <FormControlLabel
                      style={{height: "100%"}}
                      control={<Switch checked={!search.employerOnly} onChange={(e) => { setEdited(true); setSearch({...search, employerOnly: !e.target.checked}); }} color="primary" />}
                      label="Include jobs from recruiters"
                    />
                  </Grid>
                  <Grid item>
                    <FormControlLabel
                      style={{height: "100%"}}
                      control={<Switch checked={search.enabled} onChange={(e) => { setEdited(true); setSearch({...search, enabled: e.target.checked}); }} color="primary" />}
                      label="Enabled"
                    />
                  </Grid>
                </Grid>
                <Grid item container justifyContent="space-between">
                  <Grid item xs>
                    <Button variant="contained" color="secondary" startIcon={<Delete/>} onClick={() => remove()}>Delete</Button>
                  </Grid>
                  <Grid item container spacing={1} xs justifyContent="flex-end">
                    <Grid item>
                      <Button variant="contained" color="primary" startIcon={<Save/>} onClick={() => saveChanges()} disabled={!edited}>Save Changes</Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="contained"
                        onClick={() => { setEdited(false); setSearch(origSearch); }}
                        disabled={!edited}>Discard</Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Tab>
            <Tab>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Jobs Found</TableCell>
                      <TableCell>Companies Found</TableCell>
                      <TableCell>Time Taken</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {search.runs.map(r => (
                      <TableRow key={`sr-${r.id}`}>
                        <TableCell>{dayjs.utc(r.time).format("DD/MM/YYYY HH:mm")}</TableCell>
                        <TableCell>{r.newJobs}</TableCell>
                        <TableCell>{r.newCompanies}</TableCell>
                        <TableCell>{r.timeTaken >= 60 ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : `${r.timeTaken}s` }</TableCell>
                        <TableCell>{!r.success ? <Chip color="default" label="Failed"/> : null}{r.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Search;