import React, { useCallback, useEffect, useState, Fragment } from "react"
import { Box, Button, Container, Divider, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, TextField, Typography, Link, Chip, SelectChangeEvent } from "@mui/material"
import Grid from "components/Grid";
import { useNavigate, useParams } from "react-router"
import { Helmet } from "react-helmet"

import Card from "components/Card";
import ExpandableSnippet from "components/ExpandableSnippet";
import Categories, { Category } from "components/Categories";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";
import Tabs from "components/Tabs";
import Tab from "components/Tab";

import { Job as JobResponse } from "types/models/Job";

import ReactMarkdown from "react-markdown";
import { Map, MoreHoriz, OpenInNew, Subject } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import JobDialog from "./components/JobDialog";
import DeleteDialog from "components/DeleteDialog";


const Job = () => {
  const { id } = useParams();

  const [jobData, setJobData] = useState<JobResponse>();
  const [menuAnchor, setMenuAnchor] = useState<null | Element>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const navigate = useNavigate();

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
    } else {
      console.error(`API request failed: GET /api/jobs/${id}, HTTP ${response.status}`);
    }
  }, [id]);

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

    setMenuAnchor(null);
  }, [id]);


  const openMenu = useCallback((e: React.MouseEvent) => setMenuAnchor(e.currentTarget), []);
  const closeMenu = useCallback(() => setMenuAnchor(null), []);

  const deleteJob = useCallback(() => setDeleteOpen(true), []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const onDeleteConfirm = useCallback(() => navigate("/"), [navigate]);

  useEffect(() => { fetchData() }, [fetchData]);

  if (!jobData) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{jobData.Title} - {jobData.Company?.Name} | JobHunt</title>
      </Helmet>
      <JobDialog mode="edit" job={jobData} onUpdate={fetchData} />
      <DeleteDialog open={deleteOpen} entityName="job" onClose={closeDelete} onConfirm={onDeleteConfirm} deleteUrl={`/api/odata/job(${jobData.Id})`} />
      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <Typography variant="h4">{jobData.Title}</Typography>
              <Typography variant="h6"><Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${jobData.CompanyId}`}>{jobData.Company?.Name}</Link>, {jobData.Location}</Typography>
              {jobData.Archived ? (<Typography variant="subtitle1"><em>Archived</em></Typography>) : null}
            </Grid>
            <Grid item>
              <IconButton onClick={openMenu} size="large">
                <MoreHoriz/>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                keepMounted
                open={Boolean(menuAnchor)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={archiveJob}>{jobData.Archived ? "Restore" : "Archive"} Job</MenuItem>
                <MenuItem onClick={deleteJob}>Delete Job</MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mb={2}>
            <Typography variant="h6">{jobData.Salary ?? "Unknown Salary"}</Typography>
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
                { jobData.Url &&
                  <Grid item>
                    <Button variant="contained" color="secondary" startIcon={<Subject/>} endIcon={<OpenInNew/>} component="a" href={jobData.Url} target="_blank">View Listing</Button>
                  </Grid>
                }
                {jobData.Latitude && jobData.Longitude &&
                  <Grid item>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Map />}
                      endIcon={<OpenInNew />}
                      component="a"
                      href={`https://www.google.com/maps/search/?api=1&query=${jobData.Latitude},${jobData.Longitude}`}
                      target="_blank"
                    >
                      View Location
                    </Button>
                  </Grid>
                }
              </Grid>
            </Box>

            <Tabs labels={["Description", "Notes"]}>
              <Tab>
                <ExpandableSnippet hidden={!jobData.Description}>
                  <ReactMarkdown skipHtml>{jobData.Description ? jobData.Description : "_No description available_"}</ReactMarkdown>
                </ExpandableSnippet>
              </Tab>
              <Tab>
                <ReactMarkdown skipHtml>{jobData.Notes ? jobData.Notes : "_No notes added_"}</ReactMarkdown>
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