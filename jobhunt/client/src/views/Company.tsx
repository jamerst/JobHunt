import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Box, Button, Container, Chip, IconButton, Menu, MenuItem, TextField, Tooltip, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Link, PopoverOrigin } from "@mui/material"
import Grid from "components/Grid";
import { AccountBalance, Add, Block,  Delete,  DeleteOutline,  Edit,  History,  LinkedIn, Map, MoreHoriz, OpenInNew, RateReview, Refresh, Visibility, VisibilityOff, Web } from "@mui/icons-material";
import makeStyles from "makeStyles";
import  { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowParams } from "@mui/x-data-grid"
import { ODataGridInitialState } from "o-data-grid";
import ODataGrid from "components/odata/ODataGrid";

import { useParams } from "react-router"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import Card from "components/Card";
import Categories from "components/Categories";
import CardHeader from "components/CardHeader";
import CardBody from "components/CardBody";

import Tabs from "components/Tabs";
import Tab from "components/Tab";
import { getJobColumns } from "odata/JobColumns";
import CompanyEntity from "types/models/Company";
import CompanyDialog from "components/model-dialogs/CompanyDialog";
import { useFeedback } from "utils/hooks";
import EditableMarkdown from "components/forms/EditableMarkdown";
import ApiAutocomplete from "components/forms/ApiAutocomplete";
import CompanyCategory from "types/models/CompanyCategory";
import ICategoryLink from "types/models/ICategoryLink";
import WatchedPage from "types/models/WatchedPage";
import WatchedPageDialog from "components/model-dialogs/WatchedPageDialog";
import DeleteDialog from "components/forms/DeleteDialog";
import { ODataMultipleResult } from "types/odata/ODataMultipleResult";

dayjs.extend(relativeTime);

const jobColumns = getJobColumns();

const initialState: ODataGridInitialState = {
  sorting: {
    sortModel: [{ field: "posted", sort: "desc" }]
  },
  columns: {
    columnVisibilityModel: {
      "salary": { xs: false, xl: true },
      "duplicateJob/title": false,
      "status": false,
      "jobCategories": false,
      "source/displayName": false,
      "posted": { xs: false, sm: true }
    }
  },
  pagination: {
    paginationModel: {
      page: 0,
      pageSize: 10
    }
  }
}

const alwaysSelect = ["id"];

const localeText = { noRowsLabel: "No pages found" };

const useStyles = makeStyles()((theme) => ({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  dialog: {
    minWidth: "40em",
    maxWidth: "100%"
  }
}));

const anchorOrigin: PopoverOrigin = { vertical: "bottom", horizontal: "right" };
const transformOrigin: PopoverOrigin = { vertical: "top", horizontal: "right" };

type CompanyOption = {
  id: number,
  name: string
}
const getResponseOptions = (response: any) => (response as ODataMultipleResult<CompanyOption>)?.value ?? [];
const renderInput = (params: AutocompleteRenderInputParams) => <TextField {...params} label="Company" />
const getOptionLabel = (o: any) => (o as CompanyOption)?.name ?? "";
const isOptionEqualToValue = (o: any, v: any) => o.id === v.id;

const Company = () => {
  const [company, setCompany] = useState<CompanyEntity>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [pageDialogMode, setPageDialogMode] = useState<"edit" | "create">("create");
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<WatchedPage>();
  const [deletePageOpen, setDeletePageOpen] = useState(false);
  const [deletePageId, setDeletePageId] = useState<number>();
  const [mergeCompany, setMergeCompany] = useState<CompanyOption | null>(null);
  const [mergeOpen, setMergeOpen] = useState<boolean>(false);

  const { classes } = useStyles();

  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/odata/company(${id})?$expand=alternateNames,companyCategories($expand=category),watchedPages`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as CompanyEntity;

      setCompany(data);
      clear();
    } else {
      showError();
      console.error(`API request failed: GET /api/odata/company(${id})?$expand=alternateNames,companyCategories($expand=category),watchedPages, HTTP ${response.status}`);
    }
  }, [id, showError, clear]);

  const getClass = useCallback((params: GridRowParams) => params.row.seen ? "" : classes.unseen, [classes]);

  const onNotesSave = useCallback(async (value: string) => {
    showLoading();
    const response = await fetch(`/api/odata/company(${id})`, {
      method: "PATCH",
      body: JSON.stringify({
        notes: value
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setCompany(c => c ? ({ ...c, notes: value }) : undefined);
      showSuccess();
    } else {
      showError();
      console.error(`API request failed PATCH /api/odata/company(${id}), HTTP ${response.status}`);
    }
  }, [id, showLoading, showSuccess, showError]);

  //#region Categories
  const getCategoryDeleteUrl = useCallback(
    (catId: number) => `/api/odata/companyCategory(categoryId=${catId},companyId=${id})`,
    [id]
  );

  const getCategoryEntity = useCallback(
    (cat: Partial<ICategoryLink>) => ({ ...cat as CompanyCategory, companyId: id }),
    [id]
  );

  const onCategoryAdded = useCallback(
    (cat: ICategoryLink) => setCompany(c => c
      ? ({ ...c, companyCategories: [...c.companyCategories, cat as CompanyCategory] })
      : undefined),
    []
  );

  const onCategoryDeleted = useCallback(
    (id: number) => setCompany(c => c
      ? ({ ...c, companyCategories: c.companyCategories.filter(cc => cc.categoryId !== id) })
      : undefined),
    []
  );
  //#endregion

  //#region Menu Actions
  const onMenuOpen = useCallback((e: React.MouseEvent | null) => setMenuAnchor(e?.currentTarget as HTMLElement), []);
  const onMenuClose = useCallback(() => setMenuAnchor(null), []);

  const blacklistCompany = useCallback(async () => {
    const data: Partial<CompanyEntity> = {
      blacklisted: !company?.blacklisted
    };

    if (!data.blacklisted) {
      data.deleteJobsAutomatically = undefined;
    }

    const response = await fetch(`/api/odata/company(${id})`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setCompany((c) => c ? ({ ...c, blacklisted: !c.blacklisted}) : undefined);
    } else {
      showError();
      console.error(`API request failed: PATCH /api/odata/company(${id}), HTTP ${response.status}`);
    }
  }, [id, company?.blacklisted, showError]);

  const watchCompany = useCallback(async () => {
    const response = await fetch(`/api/odata/company(${id})`, {
      method: "PATCH",
      body: JSON.stringify({ watched: !company?.watched }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      setCompany((c) => c ? ({ ...c, watched: !c.watched}) : undefined);
    } else {
      showError();
      console.error(`API request failed: PATCH api/odata/company(${id}), HTTP ${response.status}`);
    }
  }, [id, company?.watched, showError]);
  //#endregion

  //#region Watched Pages
  //#region Page editing
  const onPageSave = useCallback(() => {
    fetchData();
    setPageDialogOpen(false);
    setEditingPage(undefined);
  }, [fetchData]);

  const onPageCancel = useCallback(() => {
    setPageDialogOpen(false);
    setEditingPage(undefined);
  }, []);
  //#endregion

  //#region Page deleting
  const deletePageUrl = useMemo(() => `/api/odata/watchedpage(${deletePageId})`, [deletePageId]);

  const onPageDeleteConfirm = useCallback(() => {
    setCompany((c) => c ? ({ ...c, watchedPages: c.watchedPages.filter(p => p.id !== deletePageId) }) : undefined);
  }, [deletePageId]);

  const onPageDeleteClose = useCallback(() => {
    setDeletePageId(undefined);
    setDeletePageOpen(false);
  }, []);
  //#endregion
  const onAddPageClick = useCallback(() => {
    setPageDialogMode("create");
    setPageDialogOpen(true);
  }, []);

  const onEditPageClick = useCallback((page: WatchedPage) => () => {
    setEditingPage(page);
    setPageDialogMode("edit");
    setPageDialogOpen(true);
  }, []);

  const onDeletePageClick = useCallback((id: number) => () => {
    setDeletePageId(id);
    setDeletePageOpen(true);
  }, []);

  const onRefreshPageClick = useCallback((id: number) => async () => {
    showLoading();

    const response = await fetch(`/api/watchedpages/refresh/${id}`);
    if (response.ok) {
      showSuccess();
      fetchData();
    } else {
      showError();
      console.error(`API request failed, GET /api/watchedpages/refresh/${id}, HTTP ${response.status}`);
    }
  }, [showLoading, showSuccess, showError, fetchData]);

  const watchedPageColumns: GridColDef<WatchedPage>[] = useMemo(() => [
    {
      field: "url",
      headerName: "URL",
      flex: 2,
      renderCell: (params) => <Link href={params.value} target="_blank" rel="noreferrer">{params.value}</Link>
    },
    {
      field: "lastScraped",
      headerName: "Last Scraped",
      flex: 1,
      valueFormatter: (value) => value ? dayjs.utc(value).fromNow() : "Never"
    },
    {
      field: "lastUpdated",
      headerName: "Last Updated",
      flex: 1,
      valueFormatter: (value) => value ? dayjs.utc(value).fromNow() : "Never"
    },
    {
      field: "statusMessage",
      headerName: "Status",
      flex: 1,
      valueGetter: (_, row) => row.enabled ? row.statusMessage : "Disabled"
    },
    {
      field: "actions",
      type: "actions",
      flex: .7,
      getActions: (params) => [
        <GridActionsCellItem
          label="Edit"
          icon={<Edit />}
          onClick={onEditPageClick(params.row)}
          showInMenu
          key="CompanyAction_1"
        />,
        <GridActionsCellItem
          label="Delete"
          icon={<Delete />}
          onClick={onDeletePageClick(params.row.id)}
          showInMenu
          key="CompanyAction_2"
        />,
        <Tooltip title="View change history" placement="bottom" key="CompanyAction_3">
          <IconButton component={RouterLink} to={`/page-changes/${params.row.id}`}><History /></IconButton>
        </Tooltip>,
        <GridActionsCellItem
          label="Refresh now"
          icon={<Tooltip title="Refresh now" placement="bottom"><Refresh /></Tooltip>}
          onClick={onRefreshPageClick(params.row.id)}
          disabled={!params.row.enabled}
          key="CompanyAction_4"
        />,
      ],
      renderHeader: () => (<Tooltip title="Add watched page" placement="top">
        <IconButton onClick={onAddPageClick}><Add /></IconButton>
      </Tooltip>),
    }
  ], [onEditPageClick, onDeletePageClick, onAddPageClick, onRefreshPageClick]);
  //#endregion

  //#region Merging
  const onMergeOpen = useCallback(() => {
    setMenuAnchor(null);
    setMergeOpen(true);
  }, []);
  const onMergeClose = useCallback(() => {
    setMergeOpen(false);
    setMergeCompany(null);
  }, []);

  const onMergeCompanyChange = useCallback((_: React.SyntheticEvent, v: any) => {
    setMergeCompany(v as CompanyOption);
  }, []);

  const onMergeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (mergeCompany) {
      const response = await fetch(`/api/companies/merge/${id}`, {
        method: "PATCH",
        body: JSON.stringify(mergeCompany.id),
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        setMergeOpen(false);
        navigate(`/company/${mergeCompany.id}`);
      } else {
        console.error(`API request failed: PATCH /api/companies/merge/${id}, HTTP ${response.status}`);
      }
    }
  }, [mergeCompany, navigate, id]);
  //#endregion

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!company) {
    return null;
  }

  return (
    <Container>
      <Helmet>
        <title>{company.name} | JobHunt</title>
      </Helmet>

      <CompanyDialog mode="edit" company={company} onUpdate={fetchData} />

      <Card>
        <CardHeader>
          <Grid container alignItems="center" spacing={1}>
            <Grid item container direction="column" xs spacing={1}>
              <Grid item container alignItems="center" spacing={1}>
                <Grid item><Typography variant="h4">{company.name}</Typography></Grid>
                {company.recruiter ? <Grid item><Chip label="Recruiter" /></Grid> : null}
                {company.blacklisted ? <Grid item><Tooltip title={<Typography variant="subtitle2">This company is blacklisted.</Typography>}><Block fontSize="large" /></Tooltip></Grid> : null}
                {company.blacklisted && company.deleteJobsAutomatically ? <Grid item><Tooltip title={<Typography align="center" variant="subtitle2">Jobs posted by this company are deleted automatically.</Typography>}><DeleteOutline fontSize="large" /></Tooltip></Grid> : null}
              </Grid>
              <Grid item>
                {company.alternateNames?.length ? <Typography variant="subtitle1">Also known as {company.alternateNames.map(a => a.name).join(", ")}</Typography> : null}
              </Grid>
              <Grid item>
                <Typography variant="h6">{company.location}</Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  <Tooltip title={<Typography variant="subtitle2">{company.watched ? "Unwatch Company" : "Watch Company"}</Typography>}>
                    <IconButton onClick={watchCompany} size="large">
                      {company.watched ? <Visibility/> : <VisibilityOff/>}
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <IconButton onClick={onMenuOpen} size="large">
                    <MoreHoriz/>
                  </IconButton>
                </Grid>
                <Menu
                  anchorEl={menuAnchor}
                  keepMounted
                  open={!!menuAnchor}
                  onClose={onMenuClose}
                  anchorOrigin={anchorOrigin}
                  transformOrigin={transformOrigin}
                >
                  <MenuItem onClick={blacklistCompany}>{company.blacklisted ? "Remove from blacklist" : "Blacklist company"}</MenuItem>
                  <MenuItem onClick={onMergeOpen}>Merge Company</MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </Grid>
        </CardHeader>
        <CardBody>
          <Box mt={1}>
            <Categories
              categories={company.companyCategories}
              fetchUrl="/api/odata/category"
              createUrl="/api/odata/companyCategory"
              getDeleteUrl={getCategoryDeleteUrl}
              getEntity={getCategoryEntity}
              onCategoryAdded={onCategoryAdded}
              onCategoryDeleted={onCategoryDeleted}
            />
          </Box>
          <Box my={2}>
            <Grid container spacing={2}>
              {company.website && <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Web />}
                    endIcon={<OpenInNew />}
                    component="a"
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website
                  </Button>
                </Grid>}

              {company.glassdoor && <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<RateReview/>}
                  component="a"
                  endIcon={<OpenInNew/>}
                  href={company.glassdoor}
                  target="_blank"
                  rel="noreferrer"
                >
                  Glassdoor Profile
                </Button>
              </Grid>}

              { company.linkedIn && <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<LinkedIn/>}
                  endIcon={<OpenInNew/>}
                  component="a"
                  href={company.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn Profile
                </Button>
              </Grid>}

              { company.endole && <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AccountBalance/>}
                  component="a"
                  endIcon={<OpenInNew/>}
                  href={company.endole}
                  target="_blank"
                  rel="noreferrer"
                >
                  Endole Profile
                </Button>
              </Grid>}

              {company.latitude && company.longitude && <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Map/>}
                  endIcon={<OpenInNew/>}
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${company.latitude},${company.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Location
                </Button>
              </Grid>}
            </Grid>
          </Box>
          <Tabs labels={["Notes", "Watched Pages", "Jobs"]}>
            <Tab>
              <EditableMarkdown value={company.notes} emptyText="_No notes added_" label="Notes" onSave={onNotesSave} />
            </Tab>

            <Tab>
              <DataGrid
                rows={company.watchedPages}
                columns={watchedPageColumns}
                disableColumnFilter
                disableColumnMenu
                disableColumnSelector
                disableRowSelectionOnClick
                autoHeight
                localeText={localeText}
              />

              <WatchedPageDialog
                companyId={company.id}
                open={pageDialogOpen}
                mode={pageDialogMode}
                onSave={onPageSave}
                onCancel={onPageCancel}
                watchedPage={editingPage}
              />
              <DeleteDialog
                open={deletePageOpen}
                entityName="page"
                onConfirm={onPageDeleteConfirm}
                onClose={onPageDeleteClose}
                deleteUrl={deletePageUrl}
              />
            </Tab>

            <Tab>
              <ODataGrid
                url="/api/odata/Job"
                columns={jobColumns}
                alwaysSelect={alwaysSelect}
                $filter={`companyId eq ${id} or actualCompanyId eq ${id}`}
                disableFilterBuilder
                getRowClassName={getClass}
                initialState={initialState}
              />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <Dialog open={mergeOpen} onClose={onMergeClose} aria-labelledby="add-dialog-title" fullWidth>
        <DialogTitle id="add-dialog-title">Merge Company</DialogTitle>
        <form onSubmit={onMergeSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">Select a company to merge with. All jobs, watched pages, categories, and names will be moved to the selected company.</Typography>
              </Grid>
              <Grid item xs={12}>
                <ApiAutocomplete
                  fetchUrl="/api/odata/company?$select=id,name&$orderby=name"
                  getResponseOptions={getResponseOptions}
                  renderInput={renderInput}
                  getOptionLabel={getOptionLabel}
                  isOptionEqualToValue={isOptionEqualToValue}
                  value={mergeCompany}
                  onChange={onMergeCompanyChange}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={onMergeClose} type="reset">
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