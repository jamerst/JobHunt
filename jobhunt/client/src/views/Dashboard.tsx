import React, { useCallback, useEffect, useState } from "react"
import { Typography } from "@mui/material"
import Grid from "components/Grid";
import { GridRowParams } from "@mui/x-data-grid"
import { ODataGridInitialState } from "o-data-grid";
import ODataGrid from "components/odata/ODataGrid";

import SwipeableView from "react-swipeable-views"
import { autoPlay } from "react-swipeable-views-utils"
import { Helmet } from "react-helmet"

import makeStyles from "makeStyles";

import Card from "components/Card"
import { Work } from "@mui/icons-material"
import CardHeader from "components/CardHeader"
import CardBody from "components/CardBody"
import { getJobColumns } from "odata/JobColumns";

type JobCount = {
  daily: number,
  weekly: number,
  monthly: number
}

const useStyles = makeStyles()((theme) => ({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  }
}));

const AutoPlaySwipeableView = autoPlay(SwipeableView);

const columns = getJobColumns();

const initialState: ODataGridInitialState = {
  columns: {
    columnVisibilityModel: {
      "company/name": { xs: false, md: true },
      "duplicateJob/title": false,
      "salary": { xs: false, xl: true },
      "status": false,
      "jobCategories": false,
      "source/displayName": false,
      "posted": { xs: false, sm: true },
      "remote": false
    }
  },
  sorting: {
    sortModel: [{ field: "posted", sort: "desc" }]
  }
}

const alwaysSelect = ["id"];

export const Dashboard = () => {
  const [jobCounts, setJobCounts] = useState<JobCount>({ daily: -1, weekly: -1, monthly: -1 });
  const [index, setIndex] = useState<number>(0);

  const { classes } = useStyles();

  useEffect(() => {
    const fetchJobCounts = async () => {
      const response = await fetch("/api/jobs/counts", { method: "GET"} );
      if (response.ok) {
        const data = await response.json();
        setJobCounts({ ...data });
      } else {
        console.error(`API request failed: /api/jobs/counts, HTTP ${response.status}`)
      }
    };

    fetchJobCounts()
  }, []);

  const getClass = useCallback((params: GridRowParams) => params.row.seen ? "" : classes.unseen, [classes]);

  return (
    <Grid container spacing={4}>
      <Helmet>
        <title>Dashboard | JobHunt</title>
      </Helmet>
      <Grid item container xs={12}>
        <Grid item xs={12} md={4} lg={3}>
          <Card >
            <CardHeader variant="icon" icon={(<Work fontSize="inherit"/>)}/>
            <CardBody>
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
            </CardBody>
          </Card>
        </Grid>
      </Grid>
      <Grid item xs={12} lg={8} xxl={7}>
        <Card>
          <CardHeader>
            <Typography variant="h6">Recent Jobs</Typography>
            <Typography variant="subtitle2">Jobs recently fetched from searches</Typography>
          </CardHeader>
          <CardBody>
            <ODataGrid
              url="/api/odata/Job"
              columns={columns}
              alwaysSelect={alwaysSelect}
              $filter="Archived eq false"
              getRowClassName={getClass}
              initialState={initialState}
            />
          </CardBody>
        </Card>
      </Grid>
    </Grid>
  );
}


export default Dashboard;