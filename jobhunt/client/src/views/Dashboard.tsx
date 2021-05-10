import React, { Fragment, useEffect, useState } from "react"
import { Grid, Typography, Tooltip, Chip } from "@material-ui/core"
import { GridColDef } from "@material-ui/data-grid"
import SwipeableView from "react-swipeable-views"
import { autoPlay } from "react-swipeable-views-utils"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import ApiDataGrid, { ToolbarAction } from "../components/ApiDataGrid"
import Card from "../components/Card"
import { Archive, Work } from "@material-ui/icons"
import { Link } from "react-router-dom"
import CardHeader from "../components/CardHeader"
import CardBody from "../components/CardBody"
import { Helmet } from "react-helmet"

type JobCount = {
  daily: number,
  weekly: number,
  monthly: number
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  unseen: {
    fontWeight: theme.typography.fontWeightBold
  }
}));

const AutoPlaySwipeableView = autoPlay(SwipeableView);

dayjs.extend(relativeTime);
const jobsColumns: GridColDef[] = [
  { field: "id", hide: true },
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
  {
    field: "companyName",
    headerName: "Company",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/company/${params.row.companyId}`}>{params.value}</Link>)
    }
  },
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
        let newTag = params.row.seen ? null : (<Chip label="New" color="secondary"/>);
        return (
          <Grid container justify="space-between" alignItems="center">
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
  }
];

const jobActions: ToolbarAction[] = [
  {
    text: "Archive",
    icon: (<Archive/>),
    onClick: async (ids) => {
      for (let i = 0; i < ids.length; i++) {
        const response = await fetch(`/api/jobs/archive/${ids[i]}`, { method: "PATCH" });
        if (!response.ok) {
          console.error(`API request failed: /api/jobs/archive/${ids[i]}, HTTP ${response.status}`)
        }
      }

      return { refresh: true };
    }
  }
]

export const Dashboard = () => {
  const [jobCounts, setJobCounts] = useState<JobCount>({ daily: -1, weekly: -1, monthly: -1 });
  const [index, setIndex] = useState<number>(0);

  const classes = useStyles();

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

  return (
    <Grid container spacing={4}>
      <Helmet>
        <title>Dashboard | JobHunt</title>
      </Helmet>
      <Grid item container xs={12}>
        <Grid item xs={12} md={3}>
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
      <Grid item xs={12} lg={8} xl={6}>
        <Card>
          <CardHeader>
            <Typography variant="h6">Recent Jobs</Typography>
            <Typography variant="subtitle2">Jobs recently fetched from searches</Typography>
          </CardHeader>
          <CardBody>
            <ApiDataGrid
              url="/api/jobs/latest"
              columns={jobsColumns}
              disableColumnMenu
              disableColumnSelector
              getRowClassName={(params) => params.row.seen ? "" : classes.unseen}
              toolbarActions={jobActions}
              checkboxSelection
            />
          </CardBody>
        </Card>
      </Grid>
    </Grid>
  );
}



export default Dashboard;