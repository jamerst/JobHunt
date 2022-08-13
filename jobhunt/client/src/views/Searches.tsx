import React, { useCallback, useMemo, useState } from "react"
import { Chip, Container, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Tooltip } from "@mui/material";
import Grid from "components/Grid";
import { Edit, History, Refresh } from "@mui/icons-material";
import { Helmet } from "react-helmet";

import Card from "components/Card";
import CardBody from "components/CardBody";
import CardHeader from "components/CardHeader";
import { ODataColumnVisibilityModel, ODataGrid, ODataGridColumns } from "o-data-grid";
import Date from "components/Date";
import SearchDialog from "components/model-dialogs/SearchDialog";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { Search } from "types/models/Search";
import { SearchRun } from "types/models/SearchRun";


const columnVisibility: ODataColumnVisibilityModel = {
  "lastRun": { xs: false, md: true }
}

const alwaysSelect = ["id", "displayName"];

const Searches = () => {
  const [editSearch, setEditSearch] = useState<Search>();
  const [searchRuns, setSearchRuns] = useState<SearchRun[]>();

  const onHistoryClick = useCallback((runs: SearchRun[]) => () => {
    setSearchRuns(runs);
  }, []);

  const onHistoryDialogClose = useCallback(() => setSearchRuns(undefined), []);

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
          showInMenu
        />,
        <GridActionsCellItem
          label="View History"
          icon={<History />}
          onClick={onHistoryClick(params.row.result.runs)}
          showInMenu
        />,
        <GridActionsCellItem
          label="Refresh now"
          icon={<Tooltip title="Refresh now" placement="right"><Refresh /></Tooltip>}
        />
      ]
    }
  ], []);


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

      <SearchDialog mode="create" />

      <Dialog open={!!searchRuns} onClose={onHistoryDialogClose} aria-labelled-by="runs-modal-title" fullWidth maxWidth="md">
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
                    <TableCell>{r.timeTaken >= 60 ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : `${r.timeTaken}s` }</TableCell>
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

export default Searches;