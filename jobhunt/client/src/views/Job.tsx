import React, { useCallback, useEffect, useState } from "react"
import { Box, Button, Container, Divider, Grid, IconButton, Menu, MenuItem, Tab, Tabs, Typography } from "@material-ui/core"
import { useParams } from "react-router"
import { Helmet } from "react-helmet"

import Card from "../components/Card";
import ExpandableSnippet from "../components/ExpandableSnippet";
import Categories, { Category } from "../components/Categories";
import EditableComponent from "../components/EditableComponent";
import CardHeader from "../components/CardHeader";
import CardBody from "../components/CardBody";
import TabPanel from "../components/TabPanel";
import ReactMarkdown from "react-markdown";
import { MoreHoriz, OpenInNew, Save } from "@material-ui/icons";
import { Link } from "react-router-dom";

type JobRouteParams = {
  id: string
}

type JobResponse = {
  id: number,
  title: string,
  description: string,
  salary?: string,
  location: string,
  url?: string,
  companyId?: number,
  companyName?: string,
  posted: string,
  notes?: string,
  archived: boolean,
  status: string,
  dateApplied?: string,
  categories: Category[],
  provider: string,
  sourceId?: number,
  sourceName?: string,
  seen: boolean
}

const Job = () => {
  const { id }: JobRouteParams = useParams();

  const [jobData, setJobData] = useState<JobResponse>();
  const [origJobData, setOrigJobData] = useState<JobResponse>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [tab, setTab] = useState<number>(0);

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

  const archiveJob = useCallback(async () => {
    const response = await fetch(`/api/jobs/archive/${id}?toggle=true`, { method: "PATCH" });
    if (response.ok && jobData) {
      setJobData({...jobData, archived: !jobData.archived});
    } else {
      console.error(`API request failed: /api/jobs/archive/${id}, HTTP ${response.status}`);
    }
  }, [jobData])

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
              <Typography variant="h6"><Link to={`/company/${jobData.companyId}`}>{jobData.companyName}</Link>, {jobData.location}</Typography>
              {jobData.archived ? (<Typography variant="subtitle1"><em>Archived</em></Typography>) : null}
            </Grid>
            <Grid item>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreHoriz/>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                keepMounted
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                getContentAnchorEl={null}
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
            <Typography variant="subtitle2">From "{jobData.sourceName}"</Typography>
            <Box mt={1}>
              <Categories
                categories={jobData.categories}
                updateUrl={`/api/jobs/categories/${id}`}
                onCategoryAdd={(cats) => setJobData({ ...jobData, categories: cats})}
                onCategoryRemove={(id) => setJobData({ ...jobData, categories: jobData.categories.filter(c => c.id !== id)})}
              />
            </Box>
            <Box my={2}>
              { editing ?
                (
                  <Grid container spacing={2}>
                    <Grid item>
                      <Button variant="contained" color="primary" startIcon={<Save/>} onClick={() => saveChanges()}>Save Changes</Button>
                    </Grid>
                    <Grid item>
                      <Button variant="contained" color="default" onClick={() => { setEditing(false); setJobData(origJobData); }}>Discard</Button>
                    </Grid>
                  </Grid>
                )
                :
                (<Button variant="contained" color="secondary" endIcon={<OpenInNew/>} component="a" href={jobData.url} target="_blank">View Job</Button>)
              }
            </Box>
            <Tabs value={tab} onChange={(_, t) => setTab(t)}>
              <Tab label="Description"/>
              <Tab label="Notes"/>
            </Tabs>
            <TabPanel current={tab} index={0}>
              <EditableComponent editing={editing} value={jobData.description} onChange={(e) => setJobData({...jobData, description: e.target.value})} label="Job Description" multiline rows={20}>
                <ExpandableSnippet>
                  <ReactMarkdown skipHtml>{jobData.description}</ReactMarkdown>
                </ExpandableSnippet>
              </EditableComponent>
            </TabPanel>
            <TabPanel current={tab} index={1}>
              <EditableComponent editing={editing} value={jobData.notes} onChange={(e) => setJobData({...jobData, notes: e.target.value})} label="Notes" multiline rows={20}>
                <ReactMarkdown skipHtml>{jobData.notes ?? "_No notes added_"}</ReactMarkdown>
              </EditableComponent>
            </TabPanel>
          </Box>
          <Divider/>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Job;