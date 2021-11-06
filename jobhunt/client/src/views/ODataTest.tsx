import React, { Fragment } from "react";
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import ODataGrid, { ODataGridColDef } from "components/ODataGrid";
import { GridCellParams, GridSortModel } from "@mui/x-data-grid"
import { Link as RouterLink } from "react-router-dom"
import { Typography, Tooltip, Chip, Link } from "@mui/material"
import Grid from "components/Grid";
import makeStyles from "makeStyles";

dayjs.extend(relativeTime);
const columns: ODataGridColDef[] = [
  {
    field: "Title",
    headerName: "Job Title",
    flex: 2,
    renderCell: (params: GridCellParams) => {
      return (<Link component={RouterLink} to={`/job/${params.id}`}>{params.value}</Link>)
    }
  },
  { field: "Location", headerName: "Location", flex: 1, sortable: false, },
  {
    field: "Company/Name",
    headerName: "Company",
    hide: { xs: true, md: false },
    flex: 2,
    renderCell: (params: GridCellParams) => {
      return (<Link component={RouterLink} to={`/company/${params.row.companyId}`}>{params.value}</Link>)
    },
    expand: { navigationField: "Company", select: "Id,Name" }
  },
  {
    field: "Posted",
    select: "Posted,Seen",
    headerName: "Posted",
    hide: { xs: true, sm: false },
    type: "datetime",
    flex: 1.25,
    renderCell: (params: GridCellParams) => {
      let date = dayjs(params.value as string);
      if (date.isBefore(dayjs().subtract(14, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        let newTag = params.row.seen ? null : (<Chip label="New" color="secondary" />);
        return (
          <Grid container justifyContent="space-between" alignItems="center">
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
  },
  {
    field: "Categories",
    headerName: "Categories",
    expand: {
      navigationField: "JobCategories/Category",
      select: "Name"
    },
    renderCell: (params) => {
      return params.row.JobCategories.map((c: any) => c["Category/Name"]).join(", ");
    }
  }
];

const useStyles = makeStyles()((theme) => ({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  }
}));

const ODataTest = () => {
  const { classes } = useStyles();

  return (
    <ODataGrid
      url="/api/odata/job"
      columns={columns}
      getRowClassName={(params) => params.row.seen ? "" : classes.unseen}
      idField="Id"
      defaultSortModel={defaultSort}
    />
  )
}

const defaultSort:GridSortModel = [{ field: "Posted", sort: "desc" }];

export default ODataTest;