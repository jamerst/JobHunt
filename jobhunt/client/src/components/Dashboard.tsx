import React, { Fragment } from "react"
import { Grid, Typography, Tooltip, Paper, Box } from "@material-ui/core"
import { GridColDef, GridCellParams } from "@material-ui/data-grid"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import ApiDataGrid from "./ApiDataGrid"

const jobsColumns: GridColDef[] = [
  { field: "title", headerName: "Job Title", flex: 2, sortable: false, filterable: false },
  { field: "location", headerName: "Location", flex: 1, sortable: false, filterable: false },
  { field: "companyName", headerName: "Company", flex: 2, sortable: false, filterable: false },
  {
    field: "posted",
    headerName: "Posted",
    type: "datetime",
    renderCell: (params: GridCellParams) => {
      let date = dayjs(params.value as string);
      if (date.isBefore(dayjs().subtract(14, "day"), "day")) {
        return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
      } else {
        return (
        <Tooltip
          title={<Typography variant="body2">{date.format("DD/MM/YYYY HH:mm")}</Typography>}
          placement="right"
        >
            <span>{date.fromNow()}</span>
          </Tooltip>
        );
      }
    },
    flex: 1,
    sortable: false,
    filterable: false
  }
];

export const Dashboard = () => {
  dayjs.extend(relativeTime);
  
  return (
    <Grid item xs={12}>
      <Paper>
        <Box p={3}>
          <Box mb={2}>
            <Typography variant="h4">Recent Jobs</Typography>
          </Box>
          <ApiDataGrid
            url="/api/jobs/latest"
            columns={jobsColumns}
          />
        </Box>
      </Paper>
    </Grid>
  );
}



export default Dashboard;