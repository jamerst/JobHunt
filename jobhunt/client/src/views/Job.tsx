import React, { Fragment, useCallback, useEffect, useState } from "react"
import { Box, Button, Container, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, Typography, Link, Chip, SelectChangeEvent, FormGroup, FormControlLabel, Checkbox, Tooltip } from "@mui/material"
import { Map, MoreHoriz, OpenInNew, Star, StarOutline, Subject } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router"
import { Helmet } from "react-helmet"
import ReactMarkdown from "react-markdown";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";

import Card from "components/Card";
import ExpandableSnippet from "components/ExpandableSnippet";
import Categories from "components/Categories";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";
import DeleteDialog from "components/forms/DeleteDialog";
import EditableMarkdown from "components/forms/EditableMarkdown";
import Grid from "components/Grid";
import JobDialog from "components/model-dialogs/JobDialog";
import Tab from "components/Tab";
import Tabs from "components/Tabs";

import { useFeedback } from "utils/hooks";

import ICategoryLink from "types/models/ICategoryLink";
import JobEntity from "types/models/Job";
import JobCategory from "types/models/JobCategory";


const Job = () => {
  const { id } = useParams();

  const [job, setJob] = useState<JobEntity>();
  const [menuAnchor, setMenuAnchor] = useState<null | Element>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDuplicates, setDeleteDuplicates] = useState(false);
  const [deleteUrl, setDeleteUrl] = useState(`/api/odata/job(${id})`);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const navigate = useNavigate();

  const markAsSeen = useCallback(async () => {
    const response = await fetch(`/api/odata/job(${id})`, {
      method: "PATCH",
      body: JSON.stringify({ seen: true }),
      headers: {
        "Content-Type": "application/json"
      }}
    );

    if (!response.ok) {
      console.error(`API request failed: PATCH /api/odata/job(${id}), HTTP ${response.status}`);
    }
  }, [id]);

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/odata/job(${id})?$expand=company,actualCompany,jobCategories($expand=category),duplicateJob,source`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as JobEntity;

      if (!data.seen) {
        markAsSeen();
      }

      clear();
      setJob(data);
    } else {
      showError();
      console.error(`API request failed: GET /api/odata/job(${id})?$expand=company,actualCompany,jobCategories($expand=category), HTTP ${response.status}`);
    }
  }, [id, showError, clear, markAsSeen]);

  //#region Status
  const updateStatus = useCallback(async (e: SelectChangeEvent<string>) => {
    showLoading()
    const status = e.target.value;
    const response = await fetch(`/api/odata/job(${id})`, {
      method: "PATCH",
      body: JSON.stringify({ status: status }),
      headers: {
        "Content-Type": "application/json"
      }}
    );

    if (response.ok) {
      setJob(data => data ? ({...data, status: status}) : undefined);
      showSuccess();
    } else {
      showError();
      console.error(`API request failed: PATCH /api/odata/job(${id}), HTTP ${response.status}`);
    }
  }, [id, showLoading, showSuccess, showError]);
  //#endregion

  //#region Categories
  const getCategoryDeleteUrl = useCallback(
    (catId: number) => `/api/odata/jobCategory(categoryId=${catId},jobId=${id})`,
    [id]
  );

  const getCategoryEntity = useCallback(
    (cat: Partial<ICategoryLink>) => ({ ...cat as JobCategory, jobId: id }),
    [id]
  );

  const onCategoryAdded = useCallback(
    (cat: ICategoryLink) => setJob(j => j
      ? ({ ...j, jobCategories: [...j.jobCategories, cat as JobCategory] })
      : undefined),
    []
  );

  const onCategoryDeleted = useCallback(
    (id: number) => setJob(j => j
      ? ({ ...j, jobCategories: j.jobCategories.filter(jc => jc.categoryId !== id) })
      : undefined),
    []
  );
  //#endregion

  //#region Menu
  const openMenu = useCallback((e: React.MouseEvent) => setMenuAnchor(e.currentTarget), []);
  const closeMenu = useCallback(() => setMenuAnchor(null), []);

  const archiveJob = useCallback(async () => {
    const response = await fetch(`/api/odata/job(${id})`, {
      method: "PATCH",
      body: JSON.stringify({ archived: !job!.archived }),
      headers: {
        "Content-Type": "application/json"
      }}
    );

    if (response.ok) {
      setJob(data => data ? ({ ...data, archived: !data.archived }) : undefined);
    } else {
      showError();
      console.error(`API request failed: /api/odata/job(${id}), HTTP ${response.status}`);
    }

    setMenuAnchor(null);
  }, [id, showError, job]);

  const deleteJob = useCallback(() => setDeleteOpen(true), []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const onDeleteConfirm = useCallback(() => navigate("/"), [navigate]);

  const onDeleteDuplicatesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setDeleteDuplicates(event.target.checked), []);
  useEffect(() => {
    setDeleteUrl(`/api/odata/job(${id})?deleteDuplicates=${deleteDuplicates}`);
  }, [id, deleteDuplicates]);
  //#endregion

  //#region Saving/Unsaving
  const saveJob = useCallback(async () => {
    if (job) {
      const response = await fetch(`/api/odata/job(${job.id})`, {
        method: "PATCH",
        body: JSON.stringify({ saved: !job.saved }),
        headers: {
          "Content-Type": "application/json"
        }}
      );

      if (response.ok) {
        setJob(data => data ? ({...data, saved: !data.saved }) : undefined);
      } else {
        showError();
        console.error(`API request failed: PATCH /api/odata/job(${job.id}), HTTP ${response.status}`);
      }
    }
  }, [job, showError]);
  //#endregion

  //#region Notes
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
      setJob(j => j ? ({ ...j, notes: value }) : undefined);
      showSuccess();
    } else {
      showError();
      console.error(`API request failed PATCH /api/odata/jobs(${id}), HTTP ${response.status}`);
    }
  }, [id, showLoading, showSuccess, showError]);
  //#endregion

  useEffect(() => { fetchData() }, [fetchData]);

  if (!job) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{job.title} - {job.company?.name} | JobHunt</title>
      </Helmet>

      <JobDialog mode="edit" job={job} onUpdate={fetchData} />
      <DeleteDialog open={deleteOpen} entityName="job" onClose={closeDelete} onConfirm={onDeleteConfirm} deleteUrl={deleteUrl}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={deleteDuplicates} onChange={onDeleteDuplicatesChange} />}
            label="Automatically delete future duplicates of this job"
          />
        </FormGroup>
      </DeleteDialog>

      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <Typography variant="h4">{job.title}</Typography>
              {job.duplicateJob && <Typography variant="body1">

                <Grid container spacing={1} alignItems="center">
                  <Grid item>
                    <em>
                      Duplicate of <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/job/${job.duplicateJobId}`}>{job.duplicateJob.title}</Link>
                    </em>
                  </Grid>
                  {job.duplicateJob.saved && <Grid item sx={{ display: "flex", alignItems: "center", marginTop: "-2px" }}><Star fontSize="small" /></Grid>}
                </Grid>
              </Typography>}
              <Typography variant="h6">
                {
                  job.actualCompanyId
                    ? <Fragment>
                        <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${job.actualCompanyId}`}>{job.actualCompany?.name}</Link>
                        &nbsp;(posted by <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${job.companyId}`}>{job.company?.name}</Link>)
                      </Fragment>
                    : <Link sx={{ textDecoration: "underline" }} component={RouterLink} to={`/company/${job.companyId}`}>{job.company?.name}</Link>
                }
                , {job.location}
              </Typography>
              {job.archived ? (<Typography variant="subtitle1"><em>Archived</em></Typography>) : null}
            </Grid>
            <Grid item>
              <Tooltip title={job.saved ? "Unsave Job" : "Save Job"}>
                <IconButton size="large" onClick={saveJob}>
                  {job.saved ? <Star/> : <StarOutline/>}
                </IconButton>
              </Tooltip>
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
                <MenuItem onClick={archiveJob}>{job.archived ? "Restore" : "Archive"} Job</MenuItem>
                <MenuItem onClick={deleteJob}>Delete Job</MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mb={2}>
            <Typography variant="h6">{job.salary ?? "Unknown Salary"}</Typography>
            <Typography variant="subtitle1">Posted {dayjs.utc(job.posted).local().format("DD/MM/YYYY HH:mm")}</Typography>
            <Typography variant="subtitle2">{job.source ? `From "${job.source.displayName}"` : "Created manually"}</Typography>
            <Box mt={1}>
              <Categories
                categories={job.jobCategories}
                fetchUrl="/api/odata/category"
                createUrl="/api/odata/jobCategory"
                getDeleteUrl={getCategoryDeleteUrl}
                getEntity={getCategoryEntity}
                onCategoryAdded={onCategoryAdded}
                onCategoryDeleted={onCategoryDeleted}
              >
                {job.company?.recruiter ? <Grid item><Chip label="Recruiter" color="secondary"/></Grid> : null}
              </Categories>
            </Box>

            <Box my={2}>
              <Grid container>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                  <FormControl variant="outlined" fullWidth size="small">
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={job.status}
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
                { job.url &&
                  <Grid item>
                    <Button variant="contained" color="secondary" startIcon={<Subject/>} endIcon={<OpenInNew/>} component="a" href={job.url} target="_blank">View Listing</Button>
                  </Grid>
                }
                {job.latitude && job.longitude &&
                  <Grid item>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Map />}
                      endIcon={<OpenInNew />}
                      component="a"
                      href={`https://www.google.com/maps/search/?api=1&query=${job.latitude},${job.longitude}`}
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
                <ExpandableSnippet hidden={!job.description}>
                  <ReactMarkdown skipHtml>{job.description ? job.description : "_No description available_"}</ReactMarkdown>
                </ExpandableSnippet>
              </Tab>
              <Tab>
                <EditableMarkdown value={job.notes} emptyText="_No notes added_" label="Notes" onSave={onNotesSave}/>
              </Tab>
            </Tabs>

          </Box>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Job;