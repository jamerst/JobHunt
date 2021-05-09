import React, { useCallback, useEffect, useState } from "react"
import { Box, Button, Container, Divider, Grid, IconButton, Menu, MenuItem, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@material-ui/core"
import { useParams } from "react-router"
import { Helmet } from "react-helmet"

import Card from "../components/Card";
import Categories, { Category } from "../components/Categories";
import EditableComponent from "../components/EditableComponent";
import CardHeader from "../components/CardHeader";
import CardBody from "../components/CardBody";
import ReactMarkdown from "react-markdown";
import { Delete, LinkedIn, MoreHoriz, OpenInNew, Save, Web } from "@material-ui/icons";
import TabPanel from "../components/TabPanel";

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
  watchedPages: WatchedPage[],
  categories: Category[],
  alternateNames?: string[],
}

type WatchedPage = {
  url: string,
  cssSelector?: string,
  cssBlacklist?: string,
  lastScraped?: string,
  lastUpdated?: string,
  statusMessage?: string,
  enabled: boolean
}

const UpdateArray = <T, >(array: T[], index: number, update: (current: T) => T) => {
  const result = [...array];
  result[index] = update(result[index]);
  return result;
}

const Company = () => {
  const { id }: CompanyRouteParams = useParams();

  const [companyData, setCompanyData] = useState<CompanyResponse>();
  const [origCompanyData, setOrigCompanyData] = useState<CompanyResponse>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [newWatchedPage, setNewWatchedPage] = useState<WatchedPage>({ url: "", enabled: true });
  const [tab, setTab] = useState<number>(0);

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
          <Box my={2}>
            <Grid container direction={editing ? "column" : "row"} spacing={2}>
              <Grid item>
                <EditableComponent editing={editing} value={companyData.website ?? ""} onChange={(e) => setCompanyData({...companyData, website: e.target.value})} label="Website" fontSize="h6">
                  { companyData.website ? (<Button variant="contained" color="secondary" startIcon={<Web/>} endIcon={<OpenInNew/>} component="a" href={companyData.website} target="_blank" rel="noreferrer">Visit Website</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.glassdoor ?? ""} onChange={(e) => setCompanyData({...companyData, glassdoor: e.target.value})} label="Glassdoor Profile" fontSize="h6">
                  { companyData.glassdoor ? (<Button variant="contained" color="secondary" component="a" endIcon={<OpenInNew/>} href={companyData.glassdoor} target="_blank" rel="noreferrer">View Glassdoor Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.linkedIn ?? ""} onChange={(e) => setCompanyData({...companyData, linkedIn: e.target.value})} label="LinkedIn Profile" fontSize="h6">
                  { companyData.linkedIn ? (<Button variant="contained" color="secondary" startIcon={<LinkedIn/>} endIcon={<OpenInNew/>} component="a" href={companyData.linkedIn} target="_blank" rel="noreferrer">View LinkedIn Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.endole ?? ""} onChange={(e) => setCompanyData({...companyData, endole: e.target.value})} label="Endole Profile" fontSize="h6">
                  { companyData.endole ? (<Button variant="contained" color="secondary" component="a" endIcon={<OpenInNew/>} href={companyData.linkedIn} target="_blank" rel="noreferrer">View Endole Profile</Button>) : null }
                </EditableComponent>
              </Grid>
            </Grid>
          </Box>
          <Tabs value={tab} onChange={(_, t) => setTab(t)}>
            <Tab label="Notes"/>
            <Tab label="Watched Pages"/>
            <Tab label="Jobs"/>
          </Tabs>

          <TabPanel current={tab} index={0}>
            <EditableComponent editing={editing} value={companyData.notes} onChange={(e) => setCompanyData({...companyData, notes: e.target.value})} label="Notes" multiline rows={20}>
              {companyData.notes ?
                (<ReactMarkdown skipHtml>{companyData.notes ?? ""}</ReactMarkdown>)
                : null
              }
            </EditableComponent>
          </TabPanel>

          <TabPanel current={tab} index={1}>
            <EditableComponent
              editing={editing}
              data={companyData.watchedPages}
              renderEdit={(data) => (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableCell>URL</TableCell>
                      <TableCell>CSS Selector</TableCell>
                      <TableCell>CSS Blacklist</TableCell>
                      <TableCell>Enabled</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableHead>
                    <TableBody>
                      {data.map((d, i) => (
                        <TableRow key={`wp-edit-${i}`}>
                          <TableCell>
                            <TextField
                              value={d.url}
                              onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => { return {...p, url: e.target.value}})})}
                              variant="outlined"
                              label="URL"
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={d.cssSelector ?? ""}
                              onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => { return {...p, cssSelector: e.target.value}})})}
                              variant="outlined"
                              label="CSS Selector"
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={d.cssBlacklist ?? ""}
                              onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => { return {...p, cssBlacklist: e.target.value}})})}
                              variant="outlined"
                              label="CSS Blacklist"
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={d.enabled}
                              onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => { return {...p, enabled: e.target.checked}})})}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => {
                                let newPages = [...companyData.watchedPages];
                                newPages.splice(i, 1);
                                setCompanyData({...companyData, watchedPages: newPages})
                              }}
                            >
                              <Delete/>
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>
                          <TextField
                            value={newWatchedPage.url}
                            onChange={(e) => setNewWatchedPage({ ...newWatchedPage, url: e.target.value })}
                            variant="outlined"
                            label="URL"
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={newWatchedPage.cssSelector ?? ""}
                            onChange={(e) => setNewWatchedPage({ ...newWatchedPage, cssSelector: e.target.value })}
                            variant="outlined"
                            label="CSS Selector"
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={newWatchedPage.cssBlacklist ?? ""}
                            onChange={(e) => setNewWatchedPage({ ...newWatchedPage, cssBlacklist: e.target.value })}
                            variant="outlined"
                            label="CSS Blacklist"
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch disabled checked={true}/>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => { setCompanyData({...companyData, watchedPages: [...companyData.watchedPages, newWatchedPage]}); setNewWatchedPage({ url: "", enabled: true }) }}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableCell>URL</TableCell>
                  <TableCell>Last Scraped</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Status</TableCell>
                </TableHead>
                <TableBody>
                  {companyData.watchedPages.map(p =>
                    <TableRow key={p.url}>
                      <TableCell>{p.url}</TableCell>
                      <TableCell>{p.lastScraped ?? "Never"}</TableCell>
                      <TableCell>{p.lastUpdated ?? "Never"}</TableCell>
                      <TableCell>{p.statusMessage}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </EditableComponent>
          </TabPanel>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Company;