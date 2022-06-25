import React, { Fragment, useCallback, useEffect, useState } from "react"
import { Box, Button, Container, Chip, IconButton, Menu, MenuItem, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Link, Select, FormControl, InputLabel } from "@mui/material"
import Grid from "components/Grid";
import { AccountBalance, Block, Delete, LinkedIn, Map, MoreHoriz, OpenInNew, RateReview, Save, Visibility, VisibilityOff, Web } from "@mui/icons-material";
import makeStyles from "makeStyles";
import Autocomplete from '@mui/material/Autocomplete';
import { GridRowParams, GridSortModel } from "@mui/x-data-grid"
import { ODataColumnVisibilityModel, ODataGridColDef } from "o-data-grid";
import ODataGrid from "components/ODataGrid";

import { useParams } from "react-router"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import Card from "components/Card";
import Categories, { Category } from "components/Categories";
import EditableComponent from "components/EditableComponent";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";

import Tabs from "components/Tabs";
import Tab from "components/Tab";
import Markdown from "components/Markdown";

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
  longitude?: number,
  recruiter: boolean
}

type CompanyName = {
  companyId: number,
  name: string
}

type WatchedPage = {
  id?: number,
  url: string,
  cssSelector?: string,
  cssBlacklist?: string,
  lastScraped?: string,
  lastUpdated?: string,
  statusMessage?: string,
  enabled: boolean,
  requiresJS: boolean
}

const UpdateArray = <T, >(array: T[], index: number, update: (current: T) => T) => {
  const result = [...array];
  result[index] = update(result[index]);
  return result;
}

dayjs.extend(relativeTime);

const columns: ODataGridColDef[] = [
  {
    field: "Title",
    headerName: "Job Title",
    flex: 2,
    renderCell: (params) => {
      return (<Link component={RouterLink} to={`/job/${params.id}`}>{params.value}</Link>)
    }
  },
  {
    field: "Location",
    headerName: "Location",
    flex: 1
  },
  {
    field: "Salary",
    filterField: "AvgYearlySalary",
    sortField: "AvgYearlySalary",
    label: "Median Annual Salary",
    flex: 1
  },
  {
    field: "Status"
  },
  {
    field: "JobCategories",
    headerName: "Categories",
    label: "Category",
    expand: {
      navigationField: "JobCategories/Category",
      select: "Name"
    },
    sortable: false,
    flex: 1,
    renderCell: (params) => params.row.JobCategories.map((c: any) => c["Category/Name"]).join(", ")
  },
  {
    field: "Source/DisplayName",
    expand: { navigationField: "Source", select: "DisplayName" },
    headerName: "Source",
    filterable: false,
    sortable: false,
    flex: 1,
    valueGetter: (params) => params.row[params.field] ? params.row[params.field] : "Added Manually"
  },
  {
    field: "Posted",
    select: "Posted,Seen",
    headerName: "Posted",
    type: "date",
    flex: 1.25,
    renderCell: (params) => {
      let date = dayjs.utc(params.value as string);
      if (date.isBefore(dayjs.utc().subtract(14, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        let newTag = params.row.Seen ? null : (<Chip label="New" color="secondary" />);
        return (
          <Grid container justifyContent="space-between" alignItems="center">
            <Tooltip
              title={<Typography variant="body2">{date.local().format("DD/MM/YYYY HH:mm")}</Typography>}
              placement="right"
            >
              <span>{date.fromNow()}</span>
            </Tooltip>
            {newTag}
          </Grid>
        );
      }
    }
  },
];

const columnVisibility: ODataColumnVisibilityModel = {
  "Salary": { xs: false, xl: true },
  "Status": false,
  "Categories": false,
  "Source/DisplayName": false,
  "Posted": { xs: false, sm: true }
};

const defaultSort: GridSortModel = [{ field: "Posted", sort: "desc" }]

const alwaysSelect = ["Id"];

const useStyles = makeStyles()((theme) => ({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  dialog: {
    minWidth: "40em",
    maxWidth: "100%"
  }
}));

const Company = () => {
  const { classes } = useStyles();

  const { id } = useParams();
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState<CompanyResponse>();
  const [origCompanyData, setOrigCompanyData] = useState<CompanyResponse>();
  const [alternateNames, setAlternateNames] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [newWatchedPage, setNewWatchedPage] = useState<WatchedPage>({ url: "", enabled: true, requiresJS: false });
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
      setAllCompanies(data.filter(c => c.companyId !== parseInt(id!, 10)));
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
        navigate(`/company/${mergeCompany.companyId}`);
      } else {
        console.error(`API request failed: PATCH /api/companies/merge/${id}, HTTP ${response.status}`);
      }
    }
  }, [mergeCompany, navigate, id]);

  const saveChanges = useCallback(async () => {
    if (!companyData) return;
    let names = alternateNames.split(",").map(n => n.trim()).filter(n => n !== "");
    let data:CompanyResponse = {...companyData, alternateNames: names};
    const response = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setCompanyData(data);
      setOrigCompanyData(data);
    } else {
      console.error(`API request failed: PATCH /api/companies/${id}, HTTP ${response.status}`);
      setCompanyData(origCompanyData);
      setAlternateNames(origCompanyData?.alternateNames?.join(",") ?? "");
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

  const getClass = useCallback((params: GridRowParams) => params.row.Seen ? "" : classes.unseen, [classes]);

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
                    {companyData.recruiter ? <Grid item><Chip label="Recruiter" /></Grid> : null}
                    {companyData.blacklisted ? <Grid item><Tooltip title={<Typography variant="subtitle2">This company is blacklisted.</Typography>}><Block fontSize="large" /></Tooltip></Grid> : null}
                  </Grid>
                </EditableComponent>
              </Grid>
              <Grid item>
                <EditableComponent
                  editing={editing}
                  value={alternateNames}
                  onChange={(e) => setAlternateNames(e.target.value)}
                  label="Alternate Names (comma separated)"
                  colour="#fff"
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
                    <IconButton onClick={() => toggleWatched()} size="large">
                      {companyData.watched ? <Visibility/> : <VisibilityOff/>}
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="large">
                    <MoreHoriz/>
                  </IconButton>
                </Grid>
                <Menu
                  anchorEl={menuAnchor}
                  keepMounted
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  // getContentAnchorEl={null}
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
              onCategoryRemove={(cats) => setCompanyData({ ...companyData, categories: cats})}
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
                    <Button
                      variant="contained"
                      onClick={() => { setEditing(false); setCompanyData(origCompanyData); setAlternateNames(origCompanyData?.alternateNames?.join(", ") ?? ""); }}>Discard</Button>
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
                  <Grid item md={3}>
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
                  <Grid item md={3}>
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
                  <Grid item md={3}>
                    <FormControl variant="outlined" fullWidth size="small">
                      <InputLabel id="recruiter-select-label">Recruiter</InputLabel>
                      <Select
                        value={companyData.recruiter ? 1 : 0}
                        onChange={(e) => {
                          setCompanyData({ ...companyData, recruiter: e.target.value ? true : false });
                        }}
                        labelId="recruiter-select-label"
                        label="Recruiter"
                      >
                        <MenuItem value={1}>Yes</MenuItem>
                        <MenuItem value={0}>No</MenuItem>
                      </Select>
                    </FormControl>
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
          <Tabs labels={["Notes", "Watched Pages", "Jobs"]}>
            <Tab>
              <EditableComponent editing={editing} value={companyData.notes ?? ""} onChange={(e) => setCompanyData({...companyData, notes: e.target.value})} label="Notes" multiline rows={20}>
                <Markdown value={companyData.notes ?? "_No notes added_"}/>
              </EditableComponent>
            </Tab>

            <Tab keepMounted>
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
                          <TableCell>Requires JavaScript</TableCell>
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
                                onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => ({...p, url: e.target.value}))})}
                                variant="outlined"
                                label="URL"
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={d.cssSelector ?? ""}
                                onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => ({...p, cssSelector: e.target.value}))})}
                                variant="outlined"
                                label="CSS Selector"
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={d.cssBlacklist ?? ""}
                                onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => ({...p, cssBlacklist: e.target.value}))})}
                                variant="outlined"
                                label="CSS Blacklist"
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <FormControl variant="outlined" fullWidth size="small">
                                <InputLabel id={`js-select-label-${i}`}>Requires JavaScript</InputLabel>
                                <Select
                                  value={d.requiresJS ? 1 : 0}
                                  onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => ({...p, requiresJS: e.target.value ? true : false}))})}
                                  labelId={`js-select-label-${i}`}
                                  label="Requires JavaScript"
                                >
                                  <MenuItem value={1}>Yes</MenuItem>
                                  <MenuItem value={0}>No</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="center">
                              <Switch
                                checked={d.enabled}
                                onChange={(e) => setCompanyData({...companyData, watchedPages: UpdateArray(companyData.watchedPages, i, (p) => ({...p, enabled: e.target.checked}))})}
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
                                size="large">
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
                          <TableCell>
                              <FormControl variant="outlined" fullWidth size="small">
                                <InputLabel id="new-js-select-label">Requires JavaScript</InputLabel>
                                <Select
                                  value={newWatchedPage.requiresJS ? 1 : 0}
                                  onChange={(e) => setNewWatchedPage({ ...newWatchedPage, requiresJS: e.target.value ? true : false })}
                                  labelId="new-js-select-label"
                                  label="Requires JavaScript"
                                >
                                  <MenuItem value={1}>Yes</MenuItem>
                                  <MenuItem value={0}>No</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                          <TableCell align="center">
                            <Switch disabled checked={true}/>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => { setCompanyData({...companyData, watchedPages: [...companyData.watchedPages, newWatchedPage]}); setNewWatchedPage({ url: "", enabled: true, requiresJS: false }) }}
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
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyData.watchedPages.map(p =>
                      <TableRow key={p.url}>
                        <TableCell><Link href={p.url} target="_blank" rel="noreferrer">{p.url}</Link></TableCell>
                        <TableCell>{p.lastScraped ? dayjs.utc(p.lastScraped).fromNow() : "Never"}</TableCell>
                        <TableCell>{p.lastUpdated ? dayjs.utc(p.lastUpdated).local().toDate().toLocaleString() : "Never"}</TableCell>
                        <TableCell>{p.enabled ? p.statusMessage : "Disabled"}</TableCell>
                        <TableCell align="right">{p.id && (<Button component={RouterLink} to={`/page-changes/${p.id}`} color="secondary" variant="contained" size="small" disabled={!p.lastUpdated}>View Changes</Button>)}</TableCell>
                      </TableRow>
                    )}
                    {companyData.watchedPages.length === 0 ? <TableRow><TableCell colSpan={4} align="center"><em>No pages being watched</em></TableCell></TableRow> : null}
                  </TableBody>
                </Table>
              </TableContainer>
              </EditableComponent>
            </Tab>

            <Tab>
              <ODataGrid
                url="/api/odata/Job"
                columns={columns}
                columnVisibilityModel={columnVisibility}
                getRowId={(row) => row["Id"]}
                alwaysSelect={alwaysSelect}
                defaultSortModel={defaultSort}
                $filter={`CompanyId eq ${id}`}
                disableFilterBuilder
                getRowClassName={getClass}
              />
            </Tab>
          </Tabs>


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