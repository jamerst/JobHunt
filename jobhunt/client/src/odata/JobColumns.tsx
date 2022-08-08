import React, { Fragment } from "react";

import { Chip, Slider, TextField, Tooltip, Typography, Link } from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Grid from "components/Grid";
import { Link as RouterLink } from "react-router-dom";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"

import { ODataGridColDef, escapeODataString } from "o-data-grid";

import LocationFilter from "types/odata/LocationFilter";
import { createCategoryColumn } from "./ColumnDefinitions";

export const getJobColumns = (): ODataGridColDef[] => {
  dayjs.extend(relativeTime);
  dayjs.extend(utc);

  return [
    {
      field: "title",
      select: "title,duplicateJobId",
      headerName: "Job Title",
      flex: 2,
      renderCell: (params) => <Link component={RouterLink} to={`/job/${params.id}`}>
        <Grid container spacing={1} alignItems="center" wrap="nowrap">
          <Grid item>{params.value}</Grid>
          {params.row.DuplicateJobId && <Grid item><Chip sx={{ cursor: "pointer" }} label="Duplicate" size="small" /></Grid>}
        </Grid>

      </Link>,
      autocompleteGroup: "Job"
    },
    {
      field: "duplicateJob/title",
      select: "duplicateJobId",
      expand: {
        navigationField: "duplicateJob",
        select: "title"
      },
      headerName: "Duplicate Job",
      flex: 1.5,
      renderCell: (params) => <Link component={RouterLink} to={`/job/${params.row.duplicateJobId}`}>{params.value}</Link>,
      filterOperators: ["eq", "ne"],
      filterType: "boolean",
      autocompleteGroup: "Job",
      getCustomFilterString: (_, value) => value === "true" ? "duplicateJobId ne null" : "duplicateJobId eq null"
    },
    {
      field: "location",
      headerName: "Location",
      flex: 1,
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
      getCustomFilterString: (_, v) => {
        const filter = v as LocationFilter;
        return {
          filter: `latitude ne null and longitude ne null and distance le ${filter.distance ?? 15}`,
          compute: {
            compute: `geocode('${escapeODataString(filter.location ?? "")}', latitude, longitude) as distance`,
            select: ["distance"]
          }
        };
      },
      valueGetter: (params) => `${params.row.location}${params.row.distance ? ` (${params.row.distance.toFixed(1)}mi away)` : ""}`,
      autocompleteGroup: "Job"
    },
    {
      field: "company/name",
      headerName: "Company",
      flex: 2,
      renderCell: (params) => (
        <Link
          component={RouterLink}
          to={`/company/${params.row["actualCompany/id"] ?? params.row["company/id"]}`}
        >
          <Grid container spacing={1} alignItems="center" wrap="nowrap">
            {
              params.row["actualCompany/id"]
                ? <Grid item>
                    {params.row["actualCompany/name"]} (posted by {params.value})
                  </Grid>
                : <Grid item>{params.value}</Grid>
            }
            {params.row["company/recruiter"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Recruiter" size="small" /></Grid>}
            {params.row["company/blacklisted"] && <Grid item><Chip sx={{ cursor: "pointer" }} label="Blacklisted" size="small" color="error" /></Grid>}
            {params.row["company/watched"] && <Grid item sx={{ display: "flex", alignItems: "center" }}><Visibility fontSize="small" /></Grid>}
          </Grid>
        </Link>
      ),
      expand: [
        { navigationField: "company", select: "id,name,recruiter,blacklisted,watched" },
        { navigationField: "actualCompany", select: "id,name" }
      ],
      autocompleteGroup: "Company"
    },
    {
      field: "salary",
      headerName: "Salary",
      type: "number",
      filterField: "avgYearlySalary",
      sortField: "avgYearlySalary",
      label: "Median Annual Salary",
      filterType: "number",
      filterOperators: ["eq", "ne", "gt", "lt", "ge", "le", "null", "notnull"],
      flex: 1,
      autocompleteGroup: "Job"
    },
    {
      field: "status",
      headerName: "Status",
      type: "singleSelect",
      valueOptions: ["Not Applied", "Awaiting Response", "In Progress", "Rejected", "Dropped Out"],
      filterOperators: ["eq", "ne"],
      autocompleteGroup: "Job"
    },
    createCategoryColumn(
      "jobCategories",
      "jobCategories",
      "/api/jobs/categories",
      {
        autocompleteGroup: "Job"
      }
    ),
    {
      field: "source/displayName",
      expand: { navigationField: "source", select: "displayName" },
      headerName: "Source",
      filterable: false,
      sortable: false,
      flex: 1,
      valueGetter: (params) => params.row[params.field] ? params.row[params.field] : "Added Manually",
      autocompleteGroup: "Job"
    },
    {
      field: "posted",
      select: "posted,seen,archived",
      headerName: "Posted",
      type: "date",
      flex: .9,
      renderCell: (params) => {
        let date = dayjs.utc(params.value as string);
        let dateComponent;
        let chip;

        if (params.row.seen === false) {
          chip = (<Chip label="New" color="secondary" />);
        }

        if (params.row.archived === true) {
          chip = (<Chip label="Archived" />);
        }

        if (date.isBefore(dayjs.utc().subtract(14, "day"), "day")) {
          dateComponent = (<Fragment>{date.local().format("DD/MM/YYYY HH:mm")}</Fragment>);
        } else {
          dateComponent = (
            <Tooltip
              title={<Typography variant="body2">{date.local().format("DD/MM/YYYY HH:mm")}</Typography>}
              placement="right"
            >
              <span>{date.fromNow()}</span>
            </Tooltip>
          );
        }

        return (
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>{dateComponent}</Grid>
            <Grid item>{chip}</Grid>
          </Grid>
        )
      },
      autocompleteGroup: "Job"
    },

    // filter only
    {
      field: "company/recruiter",
      label: "Company Type",
      filterOnly: true,
      filterOperators: ["eq", "ne"],
      type: "singleSelect",
      valueOptions: [
        { label: "Employer", value: false },
        { label: "Recruiter", value: true }
      ],
      autocompleteGroup: "Company"
    },
    {
      field: "company/watched",
      label: "Company Watched",
      filterOnly: true,
      filterOperators: ["eq", "ne"],
      type: "boolean",
      autocompleteGroup: "Company"
    },
    {
      field: "company/blacklisted",
      label: "Company Blacklisted",
      filterOnly: true,
      filterOperators: ["eq", "ne"],
      type: "boolean",
      autocompleteGroup: "Company"
    },
    {
      field: "description",
      label: "Description",
      filterOnly: true,
      filterOperators: ["contains"],
      autocompleteGroup: "Job"
    },
    {
      field: "notes",
      label: "Notes",
      filterOnly: true,
      filterOperators: ["contains"],
      autocompleteGroup: "Job"
    }
  ];
}