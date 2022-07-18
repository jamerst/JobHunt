import React, { useCallback, useEffect, useState, Fragment } from "react"
import { Box, Button, Container, Divider, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, TextField, Typography, Link, Chip, SelectChangeEvent } from "@mui/material"
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

import { Job as JobResponse } from "types/models/Job";

import ReactMarkdown from "react-markdown";
import { Map, MoreHoriz, OpenInNew, Save, Subject } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import JobDialog from "./components/JobDialog";


const Job = () => {
  const { id } = useParams();

  const [jobData, setJobData] = useState<JobResponse>();
  const [origJobData, setOrigJobData] = useState<JobResponse>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/odata/job(${id})?$expand=Company,ActualCompany,JobCategories/Category`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as JobResponse;

      if (!data.Seen) {
        const response = await fetch(`/api/jobs/seen/${id}`, { method: "PATCH" });
        if (response.ok) {
          data.Seen = true;
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

  const updateStatus = useCallback(async (e: SelectChangeEvent<string>) => {
    const status = e.target.value;
    const response = await fetch(`/api/jobs/status/${id}`, {
      method: "PATCH",
      body: JSON.stringify(status),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setJobData(data => data ? ({...data, Status: status}) : undefined);
      setOrigJobData(data => data ? ({...data, Status: status}) : undefined);
    } else {
      console.error(`API request failed: PATCH /api/jobs/status/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  const archiveJob = useCallback(async () => {
    const response = await fetch(`/api/jobs/archive/${id}?toggle=true`, { method: "PATCH" });
    if (response.ok) {
      setJobData(data => data ? ({ ...data, Archived: !data.Archived }) : undefined);
    } else {
      console.error(`API request failed: /api/jobs/archive/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setJobData(data => {
      const key = e.target.name as keyof JobResponse;

      if (data && key) {
        if (typeof data[key] === "string") {
          return { ...data, [key]: e.target.value };
        } else if (typeof data[key] === "number") {
          const parse = e.target.value.includes(".") ? (s: string) => parseFloat(s) : (s: string) => parseInt(s, 10);
          const result = parse(e.target.value);

          return { ...data, [key]: isNaN(result) ? undefined : result };
        }
      } else {
        return data;
      }
    })
  }, []);

  useEffect(() => { fetchData() }, [fetchData]);

  if (!jobData) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{jobData.Title} - {jobData.Company?.Name} | JobHunt</title>
      </Helmet>
      <JobDialog mode="edit" job={jobData} />
      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <EditableComponent editing={editing} value={jobData.Title} name="Title" onChange={onChange} label="Job Title" size="medium" fontSize="h4" colour="#fff">
                <Typography variant="h4">{jobData.Title}</Typography>
              </EditableComponent>
              <Typography variant="h6"><Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${jobData.CompanyId}`}>{jobData.Company?.Name}</Link>, {jobData.Location}</Typography>
              {jobData.Archived ? (<Typography variant="subtitle1"><em>Archived</em></Typography>) : null}
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
                <MenuItem onClick={() => {archiveJob(); setMenuAnchor(null);}}>{jobData.Archived ? "Restore" : "Archive"} Job</MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mb={2}>
            <EditableComponent editing={editing} value={jobData.Salary} name="Salary" onChange={onChange} label="Salary" fontSize="h6">
              <Typography variant="h6">{jobData.Salary ?? "Unknown Salary"}</Typography>
            </EditableComponent>
            {editing ? (
              <Box my={1}>
                <Grid container spacing={1}>
                  <Grid item md={3}>
                    <TextField
                      value={jobData.AvgYearlySalary ?? ""}
                      name="AvgYearlySalary"
                      onChange={onChange}
                      label="Median Annual Salary"
                      variant="outlined"
                      fullWidth
                      size="small"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      value={jobData.Latitude ?? ""}
                      onChange={onChange}
                      label="Latitude"
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      value={jobData.Longitude ?? ""}
                      onChange={onChange}
                      label="Longitude"
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : null}
            <Typography variant="subtitle1">Posted {dayjs.utc(jobData.Posted).local().format("DD/MM/YYYY HH:mm")}</Typography>
            <Typography variant="subtitle2">{jobData.Source ? `From "${jobData.Source.DisplayName}"` : "Created manually"}</Typography>
            <Box mt={1}>
              {/* <Categories
                categories={jobData.categories}
                updateUrl={`/api/jobs/categories/${id}`}
                onCategoryAdd={(cats) => setJobData({ ...jobData, categories: cats})}
                onCategoryRemove={(cats) => setJobData({ ...jobData, categories: cats})}
              >
                {jobData.companyRecruiter ? <Grid item><Chip label="Recruiter" color="secondary"/></Grid> : null}
              </Categories> */}
            </Box>
            <Box my={2}>
              <Grid container>
                <Grid item sm={2}>
                  <FormControl variant="outlined" fullWidth size="small">
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={jobData.Status}
                      onChange={updateStatus}
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
                      { jobData.Url ? (
                        <Grid item>
                          <Button variant="contained" color="secondary" startIcon={<Subject/>} endIcon={<OpenInNew/>} component="a" href={jobData.Url} target="_blank">View Listing</Button>
                        </Grid>
                      ) : null}
                      {jobData.Latitude && jobData.Longitude ? (
                        <Grid item>
                          <Button variant="contained" color="secondary" startIcon={<Map/>} endIcon={<OpenInNew/>} component="a" href={`https://www.google.com/maps/search/?api=1&query=${jobData.Latitude},${jobData.Longitude}`} target="_blank">View Location</Button>
                        </Grid>
                      ) : null}
                    </Fragment>
                  )
                }
              </Grid>
            </Box>

            <Tabs labels={["Description", "Notes"]}>
              <Tab>
                <EditableComponent editing={editing} value={jobData.Description} name="Description" onChange={onChange} label="Job Description" multiline rows={20}>
                  <ExpandableSnippet hidden={!jobData.Description}>
                    <ReactMarkdown skipHtml>{jobData.Description ? jobData.Description : "_No description available_"}</ReactMarkdown>
                  </ExpandableSnippet>
                </EditableComponent>
              </Tab>
              <Tab>
                <EditableComponent editing={editing} value={jobData.Notes} onChange={onChange} label="Notes" multiline rows={20}>
                  <ReactMarkdown skipHtml>{jobData.Notes ? jobData.Notes : "_No notes added_"}</ReactMarkdown>
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