import React, { Fragment } from "react";
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { ODataGrid, ODataGridColDef } from "o-data-grid";
import { GridCellParams, GridSortModel } from "@mui/x-data-grid"
import { Link as RouterLink } from "react-router-dom"
import { Typography, Tooltip, Chip, Link, TextField, Slider } from "@mui/material"
import Grid from "components/Grid";
import makeStyles from "makeStyles";

import DateAdapter from "@mui/lab/AdapterDayjs";
import enGB from "dayjs/locale/en-gb"
import Categories, { Category } from "components/Categories";
import { numericOperators } from "o-data-grid/FilterBuilder/constants";
import { QueryStringCollection } from "o-data-grid/FilterBuilder/types";

type LocationFilter = {
  location?: string,
  distance?: number
}

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
  {
    field: "Location",
    headerName: "Location",
    flex: 1,
    sortable: false,
    renderCustomFilter: (value, setValue) => (
      <Grid item container xs={12} md spacing={1}>
        <Grid item xs={12} md>
          <TextField
            value={(value as LocationFilter)?.location ?? ""}
            onChange={(e) => setValue({ ...value, location: e.target.value })}
            size="small"
            fullWidth
            label="Search Location"
            required
          />
        </Grid>
        <Grid item xs={12} md>
          <Typography variant="body2">Distance</Typography>
          <Slider
            value={(value as LocationFilter)?.distance ?? 15}
            onChange={(_, val) => setValue({ ...value, distance: val as number })}
            step={5}
            min={0}
            max={50}
            valueLabelFormat={(val) => `${val}mi`}
            valueLabelDisplay="auto"
            size="small"
            sx={{padding: 0}}
          />
        </Grid>
      </Grid>
    ),
    getCustomQueryString: (_, v) => {
      const filter = v as LocationFilter;
      let result: QueryStringCollection = {};
      if (filter.location) {
        result["location"] = filter.location!;
        result["distance"] = (filter.distance ?? 15).toString();
      }

      return result;
    }
  },
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
    type: "date",
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
    field: "JobCategories",
    headerName: "Category",
    expand: {
      navigationField: "JobCategories/Category",
      select: "Name"
    },
    flex: 1,
    renderCustomFilter: (value, setValue) => (
      <Grid item container alignSelf="center" xs={12} md>
        <Categories
          categories={value ? value as Category[] : []}
          onCategoryAdd={(cats) => setValue(cats)}
          onCategoryRemove={(cats) => setValue(cats)}
          openByDefault
        >
          <Grid item>
            <Typography variant="body1">Is one of:</Typography>
          </Grid>
        </Categories>
      </Grid>
    ),
    getCustomFilterString: (_, value) =>
      value && (value as Category[]).length > 0 ?
        `JobCategories/any(x:x/CategoryId in (${(value as Category[]).map(c => c.id).join(", ")}))`
        : "",
    renderCell: (params) => {
      return params.row.JobCategories.map((c: any) => c["Category/Name"]).join(", ");
    }
  },
  {
    field: "Salary",
    filterField: "AvgYearlySalary",
    sortField: "AvgYearlySalary",
    label: "Median Yearly Salary",
    filterType: "number",
    filterOperators: ["eq", "ne", "gt", "lt", "ge", "le", "null", "notnull"],
    flex: 1
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
      filterBuilderProps={{ localizationProviderProps: { dateAdapter: DateAdapter, locale: enGB } }}
    />
  )
}

const defaultSort:GridSortModel = [{ field: "Posted", sort: "desc" }];

export default ODataTest;