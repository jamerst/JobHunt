import React, { useCallback, useMemo, useState } from "react"
import { Chip, Container, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Tooltip } from "@mui/material";
import Grid from "components/Grid";
import { Delete, Edit, History, Refresh } from "@mui/icons-material";
import { Helmet } from "react-helmet";

import Card from "components/Card";
import CardBody from "components/CardBody";
import CardHeader from "components/CardHeader";
import { ODataColumnVisibilityModel, ODataGridColumns } from "o-data-grid";
import Date from "components/Date";
import SearchDialog from "components/model-dialogs/SearchDialog";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { Search } from "types/models/Search";
import { SearchRun } from "types/models/SearchRun";
import { useFeedback } from "utils/hooks";
import DeleteDialog from "components/forms/DeleteDialog";
import ODataGrid from "components/odata/ODataGrid";


const columnVisibility: ODataColumnVisibilityModel = {
  "lastRun": { xs: false, md: true }
}

const alwaysSelect = ["id", "displayName", "query", "distance", "location", "country", "provider", "employerOnly", "jobType", "maxAge"];

const Searches = () => {
  const [editSearch, setEditSearch] = useState<Search>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [searchRuns, setSearchRuns] = useState<SearchRun[]>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number>();

  const { showLoading, showError } = useFeedback();

  const onHistoryClick = useCallback((runs: SearchRun[]) => () => {
    setSearchRuns(runs);
  }, []);

  const onHistoryDialogClose = useCallback(() => setSearchRuns(undefined), []);

  const onRefreshClick = useCallback((search: Search) => async () => {
    showLoading();

    const response = await fetch(`/api/searches/refresh/${search.id}`);
    if (response.ok) {
      window.location.reload();
    } else {
      showError();
      console.error(`API request failed: GET /api/searches/refresh/${search.id}, HTTP ${response.status}`);
    }
  }, [showLoading, showError]);

  const onEditClick = useCallback((search: Search) => async () => {
    setEditSearch(search);
    setDialogMode("edit");
  }, []);

  const onDialogSave = useCallback(() => window.location.reload(), []);
  const onDialogCancel = useCallback(() => {
    setEditSearch(undefined);
    setDialogMode("create");
  }, []);

  const deleteUrl = useMemo(() => `/api/odata/search(${deleteId})`, [deleteId]);
  const onDeleteConfirm = useCallback(() => window.location.reload(), []);
  const onDeleteClose = useCallback(() => {
    setDeleteId(undefined);
    setDeleteOpen(false);
  }, []);

  const onDeleteClick = useCallback((id: number) => () => {
    setDeleteId(id);
    setDeleteOpen(true);
  }, []);

  const columns: ODataGridColumns<Search> = useMemo(() => [
    {
      field: "displayName",
      headerName: "Description",
      flex: 2,
      sortable: false,
      expand: {
        navigationField: "runs",
        top: 10,
        orderBy: "time desc"
      }
    },
    {
      field: "enabled",
      headerName: "Enabled",
      valueFormatter: (params) => params.value ? "Yes" : "No"
    },
    {
      field: "lastRun",
      select: "lastRun,lastFetchSuccess",
      headerName: "Last Run",
      flex: 1,
      renderCell: (params) => (
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Date date={params.value as string} emptyText="Never" />
          </Grid>
          {params.row.result.lastFetchSuccess === false && <Grid item><Chip label="Failed" color="error" /></Grid>}
        </Grid>
      )
    },
    {
      field: "actions",
      type: "actions",
      getActions: (params) => [
        <GridActionsCellItem
          label="Edit"
          icon={<Edit />}
          onClick={onEditClick(params.row.result)}
          showInMenu
          key="SearchAction_1"
        />,
        <GridActionsCellItem
          label="View History"
          icon={<History />}
          onClick={onHistoryClick(params.row.result.runs)}
          showInMenu
          key="SearchAction_2"
        />,
        <GridActionsCellItem
          label="Delete"
          icon={<Delete />}
          onClick={onDeleteClick(params.row.id)}
          showInMenu
          key="SearchAction_3"
        />,
        <GridActionsCellItem
          label="Refresh now"
          icon={<Tooltip title="Refresh now" placement="right"><Refresh /></Tooltip>}
          onClick={onRefreshClick(params.row.result)}
          key="SearchAction_4"
        />
      ]
    }
  ], [onEditClick, onHistoryClick, onDeleteClick, onRefreshClick]);


  return (
    <Container>
      <Helmet>
        <title>Searches | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
         <Typography variant="h4">Searches</Typography>
        </CardHeader>
        <CardBody>
          <ODataGrid
            url="/api/odata/Search"
            columns={columns}
            columnVisibilityModel={columnVisibility}
            alwaysSelect={alwaysSelect}
            disableFilterBuilder
            disableColumnSelector
          />
        </CardBody>
      </Card>

      <SearchDialog mode={dialogMode} open={!!editSearch} search={editSearch} onSave={onDialogSave} onCancel={onDialogCancel} />
      <DeleteDialog open={deleteOpen} entityName="search" onConfirm={onDeleteConfirm} onClose={onDeleteClose} deleteUrl={deleteUrl} />

      <Dialog open={!!searchRuns} onClose={onHistoryDialogClose} aria-labelledby="runs-modal-title" fullWidth maxWidth="md">
        <DialogTitle id="runs-modal-title">Search Runs</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Jobs Found</TableCell>
                  <TableCell>Companies Found</TableCell>
                  <TableCell>Time Taken</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchRuns?.length
                  ? searchRuns.map(r => (
                  <TableRow key={`sr-${r.id}`}>
                    <TableCell><Date date={r.time} disableRelative /></TableCell>
                    <TableCell>{r.newJobs}</TableCell>
                    <TableCell>{r.newCompanies}</TableCell>
                    <TableCell>{getTimeString(r.timeTaken)}</TableCell>
                    <TableCell>{!r.success && <Chip color="default" label="Failed"/>}{r.message}</TableCell>
                  </TableRow>
                  ))
                  : <TableRow><TableCell colSpan={5} align="center"><em>No search runs found</em></TableCell></TableRow>
                }
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onHistoryDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

const getTimeString = (seconds: number) => seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`

export default Searches;