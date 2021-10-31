import React, { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Typography, Tooltip, Chip, Link, useMediaQuery } from "@mui/material"
import Grid from "components/Grid";
import { GridCellParams, GridColDef, GridSortModel } from "@mui/x-data-grid"
import { useTheme } from "@mui/system";

import SwipeableView from "react-swipeable-views"
import { autoPlay } from "react-swipeable-views-utils"
import { Helmet } from "react-helmet"

import makeStyles from "makeStyles";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

// import ApiDataGrid, { ToolbarAction } from "components/ApiDataGrid"
import Card from "components/Card"
import { Archive, Work } from "@mui/icons-material"
import { Link as RouterLink } from "react-router-dom"
import CardHeader from "components/CardHeader"
import CardBody from "components/CardBody"
import ODataGrid, { ODataGridColDef, ToolbarAction } from "components/ODataGrid";


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

dayjs.extend(relativeTime);
const jobsColumns = (small: boolean): ODataGridColDef[] => {
  return [
    {
      field: "Title",
      headerName: "Job Title",
      flex: 2,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        return (<Link component={RouterLink} to={`/job/${params.id}`}>{params.value}</Link>)
      }
    },
    { field: "Location", headerName: "Location", flex: 1, sortable: false, },
    {
      field: "Company/Name",
      headerName: "Company",
      flex: 2,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        return (<Link component={RouterLink} to={`/company/${params.row.companyId}`}>{params.value}</Link>)
      },
      hide: small,
      expand: { navigationField: "Company", select: "Id,Name" }
    },
    {
      field: "Posted",
      select: "Posted,Seen",
      headerName: "Posted",
      type: "datetime",
      flex: 1.25,
      sortable: false,
      hide: small,
      renderCell: (params: GridCellParams) => {
        let date = dayjs(params.value as string);
        if (date.isBefore(dayjs().subtract(14, "day"), "day")) {
          return (<Fragment>{date.format("DD/MM/YYYY HH:mm")}</Fragment>);
        } else {
          let newTag = params.row.seen ? null : (<Chip label="New" color="secondary"/>);
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
    }
  ];
}

const responsiveColumns: ODataGridColDef[] = [
  {
    field: "Title",
    headerName: "Job Title",
    flex: 2,
    sortable: false,
    renderCell: (params: GridCellParams) => {
      return (<Link component={RouterLink} to={`/job/${params.id}`}>{params.value}</Link>)
    }
  },
  { field: "Location", headerName: "Location", flex: 1, sortable: false, },
  {
    field: "Company/Name",
    headerName: "Company",
    flex: 2,
    sortable: false,
    renderCell: (params: GridCellParams) => {
      return (<Link component={RouterLink} to={`/company/${params.row.companyId}`}>{params.value}</Link>)
    },
    expand: { navigationField: "Company", select: "Id,Name" },
    xxl: true
  },
  {
    field: "Posted",
    select: "Posted,Seen",
    headerName: "Posted",
    type: "datetime",
    flex: 1.25,
    sortable: false,
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


  const { classes } = useStyles();
  const theme = useTheme();
  const small = useMediaQuery(theme.breakpoints.down("md"));
  const columns = useMemo(() => jobsColumns(small), [small]);

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
      <Grid item xs={12} lg={8} xxl={6}>
        <Card>
          <CardHeader>
            <Typography variant="h6">Recent Jobs</Typography>
            <Typography variant="subtitle2">Jobs recently fetched from searches</Typography>
          </CardHeader>
          <CardBody>
            <ODataGrid
              url="/api/odata/job"
              columns={responsiveColumns}
              getRowClassName={(params) => params.row.seen ? "" : classes.unseen}
              toolbarActions={jobActions}
              checkboxSelection
              idField="Id"
              defaultSortModel={defaultSort}
              $filter="Archived eq false"
            />
          </CardBody>
        </Card>
      </Grid>
    </Grid>
  );
}

const defaultSort:GridSortModel = [{ field: "Posted", sort: "desc" }];

export default Dashboard;