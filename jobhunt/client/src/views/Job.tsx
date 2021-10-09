import React, { useCallback, useEffect, useState, Fragment } from "react"
import { Box, Button, Container, Divider, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, TextField, Typography, Link, Chip } from "@mui/material"
import Grid from "components/Grid";
import { useParams } from "react-router"
import { Helmet } from "react-helmet"

import Card from "components/Card";
import ExpandableSnippet from "components/ExpandableSnippet";
import Categories, { Category } from "components/Categories";
import EditableComponent from "components/EditableComponent";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";
import Tabs from "components/Tabs";
import Tab from "components/Tab";
import ReactMarkdown from "react-markdown";
import { Map, MoreHoriz, OpenInNew, Save, Subject } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";

type JobRouteParams = {
  id: string
}

type JobResponse = {
  id: number,
  title: string,
  description: string,
  salary?: string,
  avgYearlySalary?: number,
  location: string,
  url?: string,
  companyId?: number,
  companyName?: string,
  companyRecruiter?: boolean,
  posted: string,
  notes?: string,
  archived: boolean,
  status: string,
  dateApplied?: string,
  categories: Category[],
  provider: string,
  sourceId?: number,
  sourceName?: string,
  seen: boolean,
  latitude?: number,
  longitude?: number
}

const Job = () => {
  const { id }: JobRouteParams = useParams();

  const [jobData, setJobData] = useState<JobResponse>();
  const [origJobData, setOrigJobData] = useState<JobResponse>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/jobs/${id}`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as JobResponse;

      if (!data.seen) {
        const response = await fetch(`/api/jobs/seen/${id}`, { method: "PATCH" });
        if (response.ok) {
          data.seen = true;
        } else {
          console.error(`API request failed: PATCH /api/jobs/seen/${id}, HTTP ${response.status}`);
        }
      }

      setJobData(data);
      setOrigJobData(data);
    } else {
      console.error(`API request failed: GET /api/jobs/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  const saveChanges = useCallback(async () => {
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(jobData),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setOrigJobData(jobData);
    } else {
      console.error(`API request failed: PATCH /api/jobs/${id}, HTTP ${response.status}`);
      setJobData(origJobData);
    }
    setEditing(false);
  }, [jobData, origJobData, id]);

  const updateStatus = useCallback(async (status: string) => {
    const response = await fetch(`/api/jobs/status/${id}`, {
      method: "PATCH",
      body: JSON.stringify(status),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      if (jobData && origJobData) {
        setJobData({...jobData, status: status});
        setOrigJobData({...origJobData, status: status});
      }
    } else {
      console.error(`API request failed: PATCH /api/jobs/status/${id}, HTTP ${response.status}`);
    }
  }, [id, jobData, origJobData]);

  const archiveJob = useCallback(async () => {
    const response = await fetch(`/api/jobs/archive/${id}?toggle=true`, { method: "PATCH" });
    if (response.ok && jobData) {
      setJobData({...jobData, archived: !jobData.archived});
    } else {
      console.error(`API request failed: /api/jobs/archive/${id}, HTTP ${response.status}`);
    }
  }, [jobData, id])

  useEffect(() => { fetchData() }, [fetchData]);

  if (!jobData) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{jobData.title} - {jobData.companyName} | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <EditableComponent editing={editing} value={jobData.title} onChange={(e) => setJobData({...jobData, title: e.target.value})} label="Job Title" size="medium" fontSize="h4" colour="#fff">
                <Typography variant="h4">{jobData.title}</Typography>
              </EditableComponent>
              <Typography variant="h6"><Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${jobData.companyId}`}>{jobData.companyName}</Link>, {jobData.location}</Typography>
              {jobData.archived ? (<Typography variant="subtitle1"><em>Archived</em></Typography>) : null}
            </Grid>
            <Grid item>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="large">
                <MoreHoriz/>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                keepMounted
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => {setEditing(true); setMenuAnchor(null);}}>Edit Job</MenuItem>
                <MenuItem onClick={() => {archiveJob(); setMenuAnchor(null);}}>{jobData.archived ? "Restore" : "Archive"} Job</MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mb={2}>
            <EditableComponent editing={editing} value={jobData.salary} onChange={(e) => setJobData({...jobData, salary: e.target.value})} label="Salary" fontSize="h6">
              <Typography variant="h6">{jobData.salary ?? "Unknown Salary"}</Typography>
            </EditableComponent>
            {editing ? (
              <Box my={1}>
                <Grid container spacing={1}>
                  <Grid item md={3}>
                    <TextField
                      value={jobData.avgYearlySalary ?? ""}
                      onChange={(e) => setJobData({...jobData, avgYearlySalary: isNaN(parseInt(e.target.value, 10)) ? undefined : parseInt(e.target.value, 10)})}
                      label="Yearly Salary"
                      variant="outlined"
                      fullWidth
                      size="small"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      value={jobData.latitude ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setJobData({...jobData, latitude: undefined });
                        } else if (!isNaN(parseFloat(e.target.value))) {
                          setJobData({...jobData, latitude : parseFloat(e.target.value)});
                        }
                      }}
                      label="Latitude"
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      value={jobData.longitude ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setJobData({...jobData, longitude: undefined });
                        } else if (!isNaN(parseFloat(e.target.value))) {
                          setJobData({...jobData, longitude : parseFloat(e.target.value)});
                        }
                      }}
                      label="Longitude"
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : null}
            <Typography variant="subtitle1">Posted {dayjs(jobData.posted).format("DD/MM/YYYY HH:mm")}</Typography>
            <Typography variant="subtitle2">{jobData.sourceName ? `From "${jobData.sourceName}"` : "Created manually"}</Typography>
            <Box mt={1}>
              <Categories
                categories={jobData.categories}
                updateUrl={`/api/jobs/categories/${id}`}
                onCategoryAdd={(cats) => setJobData({ ...jobData, categories: cats})}
                onCategoryRemove={(id) => setJobData({ ...jobData, categories: jobData.categories.filter(c => c.id !== id)})}
              >
                {jobData.companyRecruiter ? <Grid item><Chip label="Recruiter" color="secondary"/></Grid> : null}
              </Categories>
            </Box>
            <Box my={2}>
              <Grid container>
                <Grid item sm={2}>
                  <FormControl variant="outlined" fullWidth size="small">
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={jobData.status}
                      onChange={(e) => updateStatus(e.target.value as string)}
                      label="Status"
                    >
                      <MenuItem value="Not Applied">Not Applied</MenuItem>
                      <MenuItem value="Awaiting Response">Awaiting Response</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                      <MenuItem value="Dropped Out">Dropped Out</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            <Box my={2}>
              <Grid container spacing={2}>
                { editing ?
                  (
                    <Fragment>
                      <Grid item>
                        <Button variant="contained" color="primary" startIcon={<Save/>} onClick={() => saveChanges()}>Save Changes</Button>
                      </Grid>
                      <Grid item>
                        <Button
                          variant="contained"
                          onClick={() => { setEditing(false); setJobData(origJobData); }}>Discard</Button>
                      </Grid>
                    </Fragment>
                  )
                  :
                  (
                    <Fragment>
                      { jobData.url ? (
                        <Grid item>
                          <Button variant="contained" color="secondary" startIcon={<Subject/>} endIcon={<OpenInNew/>} component="a" href={jobData.url} target="_blank">View Listing</Button>
                        </Grid>
                      ) : null}
                      {jobData.latitude && jobData.longitude ? (
                        <Grid item>
                          <Button variant="contained" color="secondary" startIcon={<Map/>} endIcon={<OpenInNew/>} component="a" href={`https://www.google.com/maps/search/?api=1&query=${jobData.latitude},${jobData.longitude}`} target="_blank">View Location</Button>
                        </Grid>
                      ) : null}
                    </Fragment>
                  )
                }
              </Grid>
            </Box>

            <Tabs labels={["Description", "Notes"]}>
              <Tab>
                <EditableComponent editing={editing} value={jobData.description} onChange={(e) => setJobData({...jobData, description: e.target.value})} label="Job Description" multiline rows={20}>
                  <ExpandableSnippet hidden={!jobData.description}>
                    <ReactMarkdown skipHtml>{jobData.description ? jobData.description : "_No description available_"}</ReactMarkdown>
                  </ExpandableSnippet>
                </EditableComponent>
              </Tab>
              <Tab>
                <EditableComponent editing={editing} value={jobData.notes} onChange={(e) => setJobData({...jobData, notes: e.target.value})} label="Notes" multiline rows={20}>
                  <ReactMarkdown skipHtml>{jobData.notes ? jobData.notes : "_No notes added_"}</ReactMarkdown>
                </EditableComponent>
              </Tab>
            </Tabs>
          </Box>
          <Divider/>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Job;