import React, { useCallback } from "react"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { GridRowParams, GridSortModel } from "@mui/x-data-grid"
import { ODataColumnVisibilityModel } from "o-data-grid";
import ODataGrid from "components/odata/ODataGrid";

import makeStyles from "makeStyles";

import { Helmet } from "react-helmet";

// have to do this and specify the locale using a string for some reason
// importing as an object and passing directly doesn't work, no clue why
import "dayjs/locale/en-gb"

import JobDialog from "components/model-dialogs/JobDialog";
import { getJobColumns } from "odata/JobColumns";

const useStyles = makeStyles()((theme) => ({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  },
  archived: {
    fontStyle: "italic"
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

const columns = getJobColumns();

const alwaysSelect = ["id", "archived"];

const columnVisibility: ODataColumnVisibilityModel = {
  "company/name": { xs: false, md: true },
  "duplicateJob/title": false,
  "salary": { xs: false, lg: true },
  "status": false,
  "jobCategories": { xs: false, xl: true },
  "source/displayName": false,
  "posted": { xs: false, sm: true },
  "remote": false,
}

const defaultSort: GridSortModel = [{ field: "posted", sort: "desc" }];

const Jobs = () => {
  const { classes } = useStyles();

  const getClass = useCallback((params: GridRowParams) => params.row.archived ? classes.archived : params.row.seen ? "" : classes.unseen, [classes]);

  return (
    <div>
      <Helmet>
        <title>Jobs | JobHunt</title>
      </Helmet>

      <ODataGrid
        url="/api/odata/Job"
        columns={columns}
        columnVisibilityModel={columnVisibility}
        alwaysSelect={alwaysSelect}
        defaultSortModel={defaultSort}
        getRowClassName={getClass}
        filterBuilderProps={{ localizationProviderProps: { dateAdapter: AdapterDayjs, adapterLocale: 'en-gb' }, autocompleteGroups: ["Job", "Company"] }}
        defaultPageSize={15}
      />

      <JobDialog mode="create" />
    </div>
  );
}

export default Jobs;