import React, { useCallback, useEffect, useState } from "react"
import { Box, Button, Container, Divider, Grid, IconButton, Menu, MenuItem, Typography } from "@material-ui/core"
import { useParams } from "react-router"
import { Helmet } from "react-helmet"

import Card from "../components/Card";
import ExpandableSnippet from "../components/ExpandableSnippet";
import Categories, { Category } from "../components/Categories";
import EditableComponent from "../components/EditableComponent";
import CardHeader from "../components/CardHeader";
import CardBody from "../components/CardBody";
import ReactMarkdown from "react-markdown";
import { LinkedIn, MoreHoriz, OpenInNew, Save, Web } from "@material-ui/icons";

type CompanyRouteParams = {
  id: string
}

type CompanyResponse = {
  id: number,
  name: string,
  location: string,
  notes?: string,
  watched: boolean,
  blacklisted: boolean,
  website?: string,
  rating?: number,
  glassdoor?: string,
  linkedIn?: string,
  endole?: string,
  careersPages?: string[],
  categories: Category[],
  alternateNames?: string[],
}

const Company = () => {
  const { id }: CompanyRouteParams = useParams();

  const [companyData, setCompanyData] = useState<CompanyResponse>();
  const [origCompanyData, setOrigCompanyData] = useState<CompanyResponse>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/companies/${id}`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as CompanyResponse;
      setCompanyData(data);
      setOrigCompanyData(data);
    } else {
      console.error(`API request failed: GET /api/companies/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  const saveChanges = useCallback(async () => {
    console.log(companyData);
    const response = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(companyData),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setOrigCompanyData(companyData);
    } else {
      console.error(`API request failed: PATCH /api/companies/${id}, HTTP ${response.status}`);
      setCompanyData(origCompanyData);
    }
    setEditing(false);
  }, [companyData, origCompanyData, id]);

  useEffect(() => { fetchData() }, [fetchData]);

  if (!companyData) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{companyData.name} | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <EditableComponent editing={editing} value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} label="Company Name" size="medium" fontSize="h4" colour="#fff">
                <Typography variant="h4">{companyData.name}</Typography>
              </EditableComponent>
              <EditableComponent editing={editing} value={companyData.location} onChange={(e) => setCompanyData({...companyData, location: e.target.value})} label="Location" size="medium" fontSize="h6" colour="#fff">
                <Typography variant="h6">{companyData.location}</Typography>
              </EditableComponent>
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
                <MenuItem onClick={() => {setEditing(true); setMenuAnchor(null);}}>Edit Company</MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mb={2}>
            <Box mt={1}>
              <Categories
                categories={companyData.categories}
                updateUrl={`/api/companies/categories/${id}`}
                onCategoryAdd={(cats) => setCompanyData({ ...companyData, categories: cats})}
                onCategoryRemove={(id) => setCompanyData({ ...companyData, categories: companyData.categories.filter(c => c.id !== id)})}
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
                      <Button variant="contained" color="default" onClick={() => { setEditing(false); setCompanyData(origCompanyData); }}>Discard</Button>
                    </Grid>
                  </Grid>
                )
                : null
              }
            </Box>

            <Grid container direction={editing ? "column" : "row"} spacing={2}>
              <Grid item>
                <EditableComponent editing={editing} value={companyData.website} onChange={(e) => setCompanyData({...companyData, website: e.target.value})} label="Website" fontSize="h6">
                  { companyData.website ? (<Button variant="contained" color="secondary" startIcon={<Web/>} endIcon={<OpenInNew/>} component="a" href={companyData.website} target="_blank" rel="noreferrer">Visit Website</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.glassdoor} onChange={(e) => setCompanyData({...companyData, glassdoor: e.target.value})} label="Glassdoor Profile" fontSize="h6">
                  { companyData.glassdoor ? (<Button variant="contained" color="secondary" component="a" endIcon={<OpenInNew/>} href={companyData.glassdoor} target="_blank" rel="noreferrer">View Glassdoor Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.linkedIn} onChange={(e) => setCompanyData({...companyData, linkedIn: e.target.value})} label="LinkedIn Profile" fontSize="h6">
                  { companyData.linkedIn ? (<Button variant="contained" color="secondary" startIcon={<LinkedIn/>} endIcon={<OpenInNew/>} component="a" href={companyData.linkedIn} target="_blank" rel="noreferrer">View LinkedIn Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.endole} onChange={(e) => setCompanyData({...companyData, endole: e.target.value})} label="Endole Profile" fontSize="h6">
                  { companyData.endole ? (<Button variant="contained" color="secondary" component="a" endIcon={<OpenInNew/>} href={companyData.linkedIn} target="_blank" rel="noreferrer">View Endole Profile</Button>) : null }
                </EditableComponent>
              </Grid>
              <Grid item>
                <EditableComponent editing={editing} value={companyData.notes} onChange={(e) => setCompanyData({...companyData, notes: e.target.value})} label="Notes" multiline rows={20}>
                  {companyData.notes ?
                    (<ReactMarkdown skipHtml>{companyData.notes ?? ""}</ReactMarkdown>)
                    : null
                  }
                </EditableComponent>
              </Grid>
            </Grid>

          </Box>
          <Divider/>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Company;