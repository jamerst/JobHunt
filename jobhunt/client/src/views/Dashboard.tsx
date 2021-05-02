import React, { Fragment, useEffect, useState, useCallback } from "react"
import { Grid, Typography, Tooltip, Paper, Box, Divider } from "@material-ui/core"
import { GridColDef, GridCellParams } from "@material-ui/data-grid"
import { green } from "@material-ui/core/colors"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import ApiDataGrid from "../components/ApiDataGrid"
import Card from "../components/Card"
import { Work } from "@material-ui/icons"

type JobCount = {
  daily: number,
  weekly: number,
  monthly: number
}

dayjs.extend(relativeTime);
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
  const [jobCounts, setJobCounts] = useState<JobCount>({ daily: -1, weekly: -1, monthly: -1 });

  const fetchJobCounts = useCallback(async () => {
    const response = await fetch("/api/jobs/counts", { method: "GET"} );
    if (response.ok) {
      const data = await response.json();
      setJobCounts({ ...data });
    } else {
      console.error(`API request failed: /api/jobs/counts, HTTP ${response.status}`)
    }
  }, []);

  useEffect(() => {
    fetchJobCounts()
  }, []);

  return (
    <Grid container spacing={4}>
      <Grid item container xs={12}>
        <Grid item xs={12} md={3}>
          <Card icon={(<Work fontSize="inherit"/>)} colour={green[600]}>
            <Typography variant="subtitle1" align="right" color="textSecondary">New Jobs</Typography>
            <Typography variant="h6" align="right">Last 24 Hours: {jobCounts.daily >= 0 ? jobCounts.daily : null}</Typography>
            <Typography variant="h6" align="right">Last Week: {jobCounts.weekly >= 0 ? jobCounts.weekly : null}</Typography>
            <Typography variant="h6" align="right">Last Month: {jobCounts.monthly >= 0 ? jobCounts.monthly : null}</Typography>

          </Card>
        </Grid>
      </Grid>
      <Grid item xs={12} lg={8} xl={6}>
        <Card title="Recent Jobs" subtitle="Jobs recently fetched from searches" icon={(<Work fontSize="inherit"/>)}>
          <ApiDataGrid
            url="/api/jobs/latest"
            columns={jobsColumns}
          />
        </Card>
      </Grid>
    </Grid>
  );
}



export default Dashboard;