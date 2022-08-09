import React, { Fragment, useCallback, useContext, useEffect, useState } from "react"
import { Box, Button, Container, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, Typography, Link, Chip, SelectChangeEvent } from "@mui/material"
import Grid from "components/Grid";
import { useNavigate, useParams } from "react-router"
import { Helmet } from "react-helmet"

import Card from "components/Card";
import ExpandableSnippet from "components/ExpandableSnippet";
import Categories from "components/Categories";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";
import Tabs from "components/Tabs";
import Tab from "components/Tab";

import JobEntity from "types/models/Job";

import ReactMarkdown from "react-markdown";
import { Map, MoreHoriz, OpenInNew, Subject } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import JobDialog from "components/model-dialogs/JobDialog";
import DeleteDialog from "components/forms/DeleteDialog";
import { ICategoryLink } from "types/models/ICategoryLink";
import JobCategory from "types/models/JobCategory";
import EditableMarkdown from "components/forms/EditableMarkdown";
import { useFeedback } from "utils/hooks";


const Job = () => {
  const { id } = useParams();

  const [jobData, setJobData] = useState<JobEntity>();
  const [menuAnchor, setMenuAnchor] = useState<null | Element>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { showLoading, showSuccess, showError } = useFeedback();

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/odata/job(${id})?$expand=company,actualCompany,jobCategories($expand=category)`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as JobEntity;

      if (!data.seen) {
        const response = await fetch(`/api/jobs/seen/${id}`, { method: "PATCH" });
        if (response.ok) {
          data.seen = true;
        } else {
          console.error(`API request failed: PATCH /api/jobs/seen/${id}, HTTP ${response.status}`);
        }
      }

      setJobData(data);
    } else {
      showError();
      console.error(`API request failed: GET /api/jobs/${id}, HTTP ${response.status}`);
    }
  }, [id, showError]);

  const updateStatus = useCallback(async (e: SelectChangeEvent<string>) => {
    showLoading()
    const status = e.target.value;
    const response = await fetch(`/api/jobs/status/${id}`, {
      method: "PATCH",
      body: JSON.stringify(status),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setJobData(data => data ? ({...data, status: status}) : undefined);
      showSuccess();
    } else {
      showError();
      console.error(`API request failed: PATCH /api/jobs/status/${id}, HTTP ${response.status}`);
    }
  }, [id, showLoading, showSuccess, showError]);

  const archiveJob = useCallback(async () => {
    const response = await fetch(`/api/jobs/archive/${id}?toggle=true`, { method: "PATCH" });
    if (response.ok) {
      setJobData(data => data ? ({ ...data, archived: !data.archived }) : undefined);
    } else {
      showError();
      console.error(`API request failed: /api/jobs/archive/${id}, HTTP ${response.status}`);
    }

    setMenuAnchor(null);
  }, [id, showError]);

  const getCategoryDeleteUrl = useCallback(
    (catId: number) => `/api/odata/jobCategory(categoryId=${catId},jobId=${id})`,
    [id]
  );

  const getCategoryEntity = useCallback(
    (cat: Partial<ICategoryLink>) => ({ ...cat as JobCategory, jobId: id }),
    [id]
  );

  const openMenu = useCallback((e: React.MouseEvent) => setMenuAnchor(e.currentTarget), []);
  const closeMenu = useCallback(() => setMenuAnchor(null), []);

  const deleteJob = useCallback(() => setDeleteOpen(true), []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const onDeleteConfirm = useCallback(() => navigate("/"), [navigate]);

  const onNotesSave = useCallback(async (value: string) => {
    showLoading();
    const response = await fetch(`/api/odata/job(${id})`, {
      method: "PATCH",
      body: JSON.stringify({
        notes: value
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setJobData(j => j ? ({ ...j, notes: value }) : undefined);
      showSuccess();
    } else {
      showError();
      console.error(`API request failed PATCH /api/odata/jobs(${id}), HTTP ${response.status}`);
    }
  }, [id, showLoading, showSuccess, showError]);

  useEffect(() => { fetchData() }, [fetchData]);

  if (!jobData) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{jobData.title} - {jobData.company?.name} | JobHunt</title>
      </Helmet>

      <JobDialog mode="edit" job={jobData} onUpdate={fetchData} />
      <DeleteDialog open={deleteOpen} entityName="job" onClose={closeDelete} onConfirm={onDeleteConfirm} deleteUrl={`/api/odata/job(${jobData.id})`} />

      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <Typography variant="h4">{jobData.title}</Typography>
              <Typography variant="h6">
                {
                  jobData.actualCompanyId
                    ? <Fragment>
                        <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${jobData.actualCompanyId}`}>{jobData.actualCompany?.name}</Link>
                        &nbsp;(posted by <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${jobData.companyId}`}>{jobData.company?.name}</Link>)
                      </Fragment>
                    : <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${jobData.companyId}`}>{jobData.company?.name}</Link>
                }
                , {jobData.location}
              </Typography>
              {jobData.archived ? (<Typography variant="subtitle1"><em>Archived</em></Typography>) : null}
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
                <MenuItem onClick={archiveJob}>{jobData.archived ? "Restore" : "Archive"} Job</MenuItem>
                <MenuItem onClick={deleteJob}>Delete Job</MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mb={2}>
            <Typography variant="h6">{jobData.salary ?? "Unknown Salary"}</Typography>
            <Typography variant="subtitle1">Posted {dayjs.utc(jobData.posted).local().format("DD/MM/YYYY HH:mm")}</Typography>
            <Typography variant="subtitle2">{jobData.source ? `From "${jobData.source.displayName}"` : "Created manually"}</Typography>
            <Box mt={1}>
              <Categories
                initialValue={jobData.jobCategories}
                fetchUrl="/api/jobs/categories"
                createUrl="/api/odata/jobCategory"
                getDeleteUrl={getCategoryDeleteUrl}
                getEntity={getCategoryEntity}
              >
                {jobData.company?.recruiter ? <Grid item><Chip label="Recruiter" color="secondary"/></Grid> : null}
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
                { jobData.url &&
                  <Grid item>
                    <Button variant="contained" color="secondary" startIcon={<Subject/>} endIcon={<OpenInNew/>} component="a" href={jobData.url} target="_blank">View Listing</Button>
                  </Grid>
                }
                {jobData.latitude && jobData.longitude &&
                  <Grid item>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Map />}
                      endIcon={<OpenInNew />}
                      component="a"
                      href={`https://www.google.com/maps/search/?api=1&query=${jobData.latitude},${jobData.longitude}`}
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
                <ExpandableSnippet hidden={!jobData.description}>
                  <ReactMarkdown skipHtml>{jobData.description ? jobData.description : "_No description available_"}</ReactMarkdown>
                </ExpandableSnippet>
              </Tab>
              <Tab>
                <EditableMarkdown value={jobData.notes} emptyText="_No notes added_" label="Notes" onSave={onNotesSave}/>
              </Tab>
            </Tabs>

          </Box>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Job;