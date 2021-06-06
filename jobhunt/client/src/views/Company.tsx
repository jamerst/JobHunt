import React, { Fragment, useCallback, useEffect, useState } from "react"
import { Box, Button, Container, Chip, Grid, IconButton, Menu, MenuItem, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core"
import { GridColDef } from "@material-ui/data-grid"
import { AccountBalance, Block, Delete, LinkedIn, Map, MoreHoriz, OpenInNew, RateReview, Save, Visibility, VisibilityOff, Web } from "@material-ui/icons";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import Autocomplete from "@material-ui/lab/Autocomplete";
import { useHistory, useParams } from "react-router"
import { Link } from "react-router-dom"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import Card from "../components/Card";
import Categories, { Category } from "../components/Categories";
import EditableComponent from "../components/EditableComponent";
import CardHeader from "../components/CardHeader";
import CardBody from "../components/CardBody";

import TabPanel from "../components/TabPanel";
import ApiDataGrid from "../components/ApiDataGrid";
import Markdown from "../components/Markdown";
import { useResponsive } from "../utils/hooks";

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
  latitude?: number,
  longitude?: number
}

type CompanyName = {
  companyId: number,
  name: string
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

dayjs.extend(relativeTime);
const jobsColumns = (small: boolean | undefined): GridColDef[] => [
  { field: "id", hide: true },
  {
    field: "title",
    headerName: "Job Title",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/job/${params.id}`}>{params.value}</Link>)
    }
  },
  { field: "location", headerName: "Location", flex: 1, sortable: false, hide: small, },
  { field: "companyName", headerName: "Company", flex: 2, sortable: false, hide: small },
  {
    field: "posted",
    headerName: "Posted",
    type: "datetime",
    flex: 1,
    sortable: false,
    renderCell: (params) => {
      let date = dayjs(params.value as string);
      if (date.isBefore(dayjs().subtract(14, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        let newTag = params.row.seen ? null : (<Chip label="New" color="secondary"/>);
        return (
          <Grid container justify="space-between" alignItems="center">
            <Tooltip
              title={<Typography variant="body2">{date.format("DD/MM/YYYY HH:mm")}</Typography>}
              placement="right"
            >
              <span>{date.fromNow()}</span>
            </Tooltip>
            {newTag}
          </Grid>
        );
      }
    }
  }
];

const useStyles = makeStyles((theme: Theme) => createStyles({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  dialog: {
    minWidth: "40em",
    maxWidth: "100%"
  }
}));

const Company = () => {
  const classes = useStyles();

  const { id }: CompanyRouteParams = useParams();
  const history = useHistory();
  const r = useResponsive();
  const small = r({xs: true, md: false});

  const [companyData, setCompanyData] = useState<CompanyResponse>();
  const [origCompanyData, setOrigCompanyData] = useState<CompanyResponse>();
  const [alternateNames, setAlternateNames] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [newWatchedPage, setNewWatchedPage] = useState<WatchedPage>({ url: "", enabled: true });
  const [tab, setTab] = useState<number>(0);
  const [allCompanies, setAllCompanies] = useState<CompanyName[]>([]);
  const [mergeCompany, setMergeCompany] = useState<CompanyName | null>(null);
  const [mergeOpen, setMergeOpen] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/companies/${id}`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as CompanyResponse;
      setCompanyData(data);
      setOrigCompanyData(data);
      setAlternateNames(data.alternateNames?.join(", ") ?? "");
    } else {
      console.error(`API request failed: GET /api/companies/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  const fetchCompanies = useCallback(async () => {
    if (allCompanies.length > 0) {
      return;
    }

    const response = await fetch("/api/companies/names");
    if (response.ok) {
      const data = await response.json() as CompanyName[];
      setAllCompanies(data.filter(c => c.companyId !== parseInt(id, 10)));
    } else {
      console.error(`API request failed: GET /api/companies/names, HTTP ${response.status}`);
    }
  }, [allCompanies, id]);

  const merge = useCallback(async () => {
    if (mergeCompany) {
      const response = await fetch(`/api/companies/merge/${id}`, {
        method: "PATCH",
        body: JSON.stringify(mergeCompany.companyId),
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        setMergeOpen(false);
        history.push(`/company/${mergeCompany.companyId}`);
      } else {
        console.error(`API request failed: PATCH /api/companies/merge/${id}, HTTP ${response.status}`);
      }
    }
  }, [mergeCompany, history, id]);

  const saveChanges = useCallback(async () => {
    let data = {...companyData, alternateNames: alternateNames.split(", ").map(n => n.trim())};
    const response = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setOrigCompanyData(companyData);
    } else {
      console.error(`API request failed: PATCH /api/companies/${id}, HTTP ${response.status}`);
      setCompanyData(origCompanyData);
      setAlternateNames(origCompanyData?.alternateNames?.join(", ") ?? "");
    }
    setEditing(false);
  }, [companyData, origCompanyData, id, alternateNames]);

  const toggleBlacklist = useCallback(async () => {
    const response = await fetch(`/api/companies/blacklist/${id}`, { method: "PATCH" });
    if (response.ok && companyData) {
      setCompanyData({...companyData, blacklisted: !companyData.blacklisted});
    } else {
      console.error(`API request failed: PATCH /api/companies/blacklist/${id}, HTTP ${response.status}`);
    }
  }, [id, companyData]);

  const toggleWatched = useCallback(async () => {
    const response = await fetch(`/api/companies/watch/${id}`, { method: "PATCH" });
    if (response.ok && companyData) {
      setCompanyData({...companyData, watched: !companyData.watched});
    } else {
      console.error(`API request failed: PATCH /api/companies/blacklist/${id}, HTTP ${response.status}`);
    }
  }, [id, companyData]);

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
            <Grid item container direction="column" xs spacing={1}>
              <Grid item>
                <EditableComponent editing={editing} value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} label="Company Name" size="medium" fontSize="h4" colour="#fff">
                  <Grid item container alignItems="center" spacing={1}>
                    <Grid item><Typography variant="h4">{companyData.name}</Typography></Grid>
                    {companyData.blacklisted ? <Grid item><Tooltip title={<Typography variant="subtitle2">This company is blacklisted.</Typography>}><Block fontSize="large"/></Tooltip></Grid> : null}
                  </Grid>
                </EditableComponent>
              </Grid>
              <Grid item>
                <EditableComponent
                  editing={editing}
                  value={alternateNames}
                  onChange={(e) => setAlternateNames(e.target.value)}
                  label="Alternate Names (comma separated)"
                >
                  {companyData.alternateNames?.length ? <Typography variant="subtitle1">Also known as {companyData.alternateNames.join(", ")}</Typography> : null}
                </EditableComponent>
              </Grid>
              <Grid item>
                <EditableComponent editing={editing} value={companyData.location} onChange={(e) => setCompanyData({...companyData, location: e.target.value})} label="Location" size="medium" fontSize="h6" colour="#fff">
                  <Typography variant="h6">{companyData.location}</Typography>
                </EditableComponent>
              </Grid>
            </Grid>
            <Grid item>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  <Tooltip title={<Typography variant="subtitle2">{companyData.watched ? "Unwatch Company" : "Watch Company"}</Typography>}>
                    <IconButton onClick={() => toggleWatched()}>
                      {companyData.watched ? <Visibility/> : <VisibilityOff/>}
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                    <MoreHoriz/>
                  </IconButton>
                </Grid>
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
                  <MenuItem onClick={() => {toggleBlacklist(); setMenuAnchor(null);}}>{companyData.blacklisted ? "Remove from blacklist" : "Blacklist company"}</MenuItem>
                  <MenuItem onClick={() => { fetchCompanies(); setMergeOpen(true); setMenuAnchor(null); }}>Merge Company</MenuItem>
                </Menu>
              </Grid>
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
                    <Button variant="contained" color="default" onClick={() => { setEditing(false); setCompanyData(origCompanyData); setAlternateNames(origCompanyData?.alternateNames?.join(", ") ?? ""); }}>Discard</Button>
                  </Grid>
                </Grid>
              )
              : null
            }
          </Box>
          <Box my={2}>
            <Grid container direction={editing ? "column" : "row"} spacing={2}>
              <Grid item>
                <EditableComponent editing={editing} value={companyData.website ?? ""} onChange={(e) => setCompanyData({...companyData, website: e.target.value})} label="Website">
                  { companyData.website ? (<Button variant="contained" color="secondary" startIcon={<Web/>} endIcon={<OpenInNew/>} component="a" href={companyData.website} target="_blank" rel="noreferrer">Website</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.glassdoor ?? ""} onChange={(e) => setCompanyData({...companyData, glassdoor: e.target.value})} label="Glassdoor Profile">
                  { companyData.glassdoor ? (<Button variant="contained" color="secondary" startIcon={<RateReview/>} component="a" endIcon={<OpenInNew/>} href={companyData.glassdoor} target="_blank" rel="noreferrer">Glassdoor Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.linkedIn ?? ""} onChange={(e) => setCompanyData({...companyData, linkedIn: e.target.value})} label="LinkedIn Profile">
                  { companyData.linkedIn ? (<Button variant="contained" color="secondary" startIcon={<LinkedIn/>} endIcon={<OpenInNew/>} component="a" href={companyData.linkedIn} target="_blank" rel="noreferrer">LinkedIn Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              <Grid item>
                <EditableComponent editing={editing} value={companyData.endole ?? ""} onChange={(e) => setCompanyData({...companyData, endole: e.target.value})} label="Endole Profile">
                  { companyData.endole ? (<Button variant="contained" color="secondary" startIcon={<AccountBalance/>} component="a" endIcon={<OpenInNew/>} href={companyData.endole} target="_blank" rel="noreferrer">Endole Profile</Button>) : null }
                </EditableComponent>
              </Grid>

              {editing ? (
                <Grid item container spacing={1}>
                  <Grid item xs={3}>
                    <TextField
                      value={companyData.latitude ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setCompanyData({...companyData, latitude: undefined });
                        } else if (!isNaN(parseFloat(e.target.value))) {
                          setCompanyData({...companyData, latitude : parseFloat(e.target.value)});
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
                      value={companyData.longitude ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setCompanyData({...companyData, longitude: undefined });
                        } else if (!isNaN(parseFloat(e.target.value))) {
                          setCompanyData({...companyData, longitude : parseFloat(e.target.value)});
                        }
                      }}
                      label="Longitude"
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Fragment>
                  {companyData.latitude && companyData.longitude ? (
                    <Grid item>
                      <Button variant="contained" color="secondary" startIcon={<Map/>} endIcon={<OpenInNew/>} component="a" href={`https://www.google.com/maps/search/?api=1&query=${companyData.latitude},${companyData.longitude}`} target="_blank" rel="noreferrer">View Location</Button>
                    </Grid>
                  ) : null}
                </Fragment>
              )}
            </Grid>
          </Box>
          <Tabs value={tab} onChange={(_, t) => setTab(t)}>
            <Tab label="Notes"/>
            <Tab label="Watched Pages"/>
            <Tab label="Jobs"/>
          </Tabs>

          <TabPanel current={tab} index={0}>
            <EditableComponent editing={editing} value={companyData.notes ?? ""} onChange={(e) => setCompanyData({...companyData, notes: e.target.value})} label="Notes" multiline rows={20}>
              {companyData.notes ?
                (<Markdown value={companyData.notes ?? ""}/>)
                : null
              }
            </EditableComponent>
          </TabPanel>

          <TabPanel current={tab} index={1} keepMounted>
            <EditableComponent
              editing={editing}
              data={companyData.watchedPages}
              renderEdit={(data) => (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>URL</TableCell>
                        <TableCell>CSS Selector</TableCell>
                        <TableCell>CSS Blacklist</TableCell>
                        <TableCell>Enabled</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
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
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell>Last Scraped</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companyData.watchedPages.map(p =>
                    <TableRow key={p.url}>
                      <TableCell><a href={p.url} target="_blank" rel="noreferrer">{p.url}</a></TableCell>
                      <TableCell>{p.lastScraped ? dayjs(p.lastScraped).fromNow() : "Never"}</TableCell>
                      <TableCell>{p.lastUpdated ? dayjs(p.lastUpdated).toDate().toLocaleString() : "Never"}</TableCell>
                      <TableCell>{p.statusMessage}</TableCell>
                    </TableRow>
                  )}
                  {companyData.watchedPages.length === 0 ? <TableRow><TableCell colSpan={4} align="center"><em>No pages being watched</em></TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </TableContainer>
            </EditableComponent>
          </TabPanel>

          <TabPanel current={tab} index={2} keepMounted>
            <ApiDataGrid
              url={`/api/companies/${id}/jobs`}
              columns={jobsColumns(small)}
              disableColumnMenu
              disableColumnSelector
              getRowClassName={(params) => params.row.seen ? "" : classes.unseen}
              checkboxSelection={false}
            />
          </TabPanel>
        </CardBody>
      </Card>
      <Dialog open={mergeOpen} onClose={() => setMergeOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Merge Company</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); merge(); }}>
          <DialogContent className={classes.dialog}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">Select a company to merge with. All jobs, watched pages, categories, and names will be moved to the selected company.</Typography>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={allCompanies}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => <TextField {...params} label="Company" variant="outlined" />}
                  fullWidth
                  value={mergeCompany}
                  onChange={(_, val) => setMergeCompany(val)}
                />

              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={() => { setMergeCompany(null); setMergeOpen(false); }} type="reset">
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={!mergeCompany}>
              Merge
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Company;