import React, { Fragment, useEffect, useState, useCallback } from "react"
import { Grid, Typography, Tooltip, Paper, Box, Divider } from "@material-ui/core"
import { GridColDef, GridCellParams } from "@material-ui/data-grid"
import { green } from "@material-ui/core/colors"
import SwipeableView from "react-swipeable-views"
import { autoPlay } from "react-swipeable-views-utils"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import ApiDataGrid from "../components/ApiDataGrid"
import Card from "../components/Card"
import { Work } from "@material-ui/icons"
import { Link } from "react-router-dom"

type JobCount = {
  daily: number,
  weekly: number,
  monthly: number
}

const AutoPlaySwipeableView = autoPlay(SwipeableView);

dayjs.extend(relativeTime);
const jobsColumns: GridColDef[] = [
  { field: "id", hide: true, headerName: "Job ID" },
  {
    field: "title",
    headerName: "Job Title",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/job/${params.id}`}>{params.value}</Link>)
    }
  },
  { field: "location", headerName: "Location", flex: 1, sortable: false, },
  { field: "companyName", headerName: "Company", flex: 2, sortable: false, },
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
        return (
        <Tooltip
          title={<Typography variant="body2">{date.format("DD/MM/YYYY HH:mm")}</Typography>}
          placement="right"
        >
            <span>{date.fromNow()}</span>
          </Tooltip>
        );
      }
    }
  }
];

export const Dashboard = () => {
  const [jobCounts, setJobCounts] = useState<JobCount>({ daily: -1, weekly: -1, monthly: -1 });
  const [index, setIndex] = useState<number>(0);

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
            <AutoPlaySwipeableView index={index} onChangeIndex={(i) => setIndex(i)} interval={7500}>
              <div>
                <Typography variant="h6" align="right">{jobCounts.daily >= 0 ? jobCounts.daily : null}</Typography>
                <Typography variant="subtitle2" align="right" color="textSecondary">Last 24 Hours</Typography>
              </div>
              <div>
                <Typography variant="h6" align="right">{jobCounts.weekly >= 0 ? jobCounts.weekly : null}</Typography>
                <Typography variant="subtitle2" align="right" color="textSecondary">Last Week</Typography>
              </div>
              <div>
                <Typography variant="h6" align="right">{jobCounts.monthly >= 0 ? jobCounts.monthly : null}</Typography>
                <Typography variant="subtitle2" align="right" color="textSecondary">Last Month</Typography>
              </div>
            </AutoPlaySwipeableView>
          </Card>
        </Grid>
      </Grid>
      <Grid item xs={12} lg={8} xl={6}>
        <Card title="Recent Jobs" subtitle="Jobs recently fetched from searches">
          <ApiDataGrid
            url="/api/jobs/latest"
            columns={jobsColumns}
            disableColumnMenu
            disableColumnSelector
          />
        </Card>
      </Grid>
    </Grid>
  );
}



export default Dashboard;