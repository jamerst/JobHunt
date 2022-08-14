import React from "react";

import { Chip, Slider, TextField, Typography, Link } from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Grid from "components/Grid";
import { Link as RouterLink } from "react-router-dom";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

import { numericOperators, escapeODataString, ODataGridColumns } from "o-data-grid";
import { getCategoryFilterString } from "components/odata/ODataCategoryFilter";
import LocationFilter from "types/odata/LocationFilter";
import { createCategoryColumn } from "./ColumnDefinitions";
import Company from "types/models/Company";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
})

export const getCompanyColumns = (): ODataGridColumns<Company> => {
  dayjs.extend(relativeTime);
  dayjs.extend(utc);

  return [
    {
      field: "name",
      select: "name,recruiter,blacklisted,watched",
      headerName: "Name",
      flex: 2,
      renderCell: (params) => (
        <Link
          component={RouterLink}
          to={`/company/${params.id}`}
        >
          <Grid container spacing={1} alignItems="center" wrap="nowrap">
            <Grid item>
              {params.value}
            </Grid>
            {params.row.result.recruiter && <Grid item><Chip sx={{ cursor: "pointer" }} label="Recruiter" size="small" /></Grid>}
            {params.row.result.blacklisted && <Grid item><Chip sx={{ cursor: "pointer" }} label="Blacklisted" size="small" color="error" /></Grid>}
            {params.row.result.watched && <Grid item sx={{ display: "flex", alignItems: "center" }}><Visibility fontSize="small" /></Grid>}
          </Grid>
        </Link>
      )
    },
    {
      field: "location",
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
      valueGetter: (params) => `${params.row["location"]}${params.row["distance"] ? ` (${params.row["distance"].toFixed(1)}mi away)` : ""}`,
    },
    {
      // This field has to be calculated clientside - $apply doesn't appear to work for collections
      field: "AvgSalary",
      headerName: "Average Salary",
      expand: { navigationField: "jobs", select: "avgYearlySalary" },
      type: "number",
      filterable: false,
      sortable: false,
      valueGetter: (params) => {
        const jobs = params.row.result.jobs.filter(j => j.avgYearlySalary);
        if (jobs && jobs.length > 0) {
          return currencyFormatter.format(jobs.map(j => j.avgYearlySalary!).reduce((a, b) => a + b) / jobs.length);
        } else {
          return "";
        }
      },
      flex: .5
    },
    {
      field: "jobs@odata.count",
      filterField: "jobs/$count",
      sortField: "jobs/$count",
      expand: { navigationField: "jobs", top: 0, count: true },
      filterOperators: numericOperators,
      headerName: "Jobs Posted",
      type: "number",
      flex: .5
    },
    {
      field: "latestJob",
      headerName: "Latest Job Posted",
      expand: { navigationField: "jobs", select: "posted", orderBy: "posted desc" },
      type: "dateTime",
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        if (params.row.result.jobs?.length) {
          return dayjs.utc(params.row.result.jobs[0].posted).local().format("DD/MM/YYYY HH:mm");
        } else {
          return "";
        }
      },
      flex: .5
    },
    {
      field: "latestPageUpdate",
      headerName: "Latest Page Updated",
      expand: { navigationField: "watchedPages", select: "lastUpdated", orderBy: "lastUpdated desc", top: 1 },
      filterable: false,
      sortable: false,
      type: "dateTime",
      flex: .5,
      renderCell: (params) => {
        if (params.row.result.watchedPages?.length) {
          return dayjs.utc(params.row.result.watchedPages[0].lastUpdated).local().format("DD/MM/YYYY HH:mm");
        } else {
          return "";
        }
      }
    },
    createCategoryColumn(
      "companyCategories",
      "companyCategories",
      "/api/companies/categories"
    ),
    {
      field: "recruiter",
      label: "Company Type",
      filterOnly: true,
      filterOperators: ["eq", "ne"],
      type: "singleSelect",
      valueOptions: [
        { label: "Employer", value: false },
        { label: "Recruiter", value: true }
      ],
    },
    {
      field: "watched",
      label: "Company Watched",
      filterOnly: true,
      filterOperators: ["eq", "ne"],
      type: "boolean",
    },
    {
      field: "blacklisted",
      label: "Company Blacklisted",
      filterOnly: true,
      filterOperators: ["eq", "ne"],
      type: "boolean",
    },
    {
      field: "notes",
      label: "Notes",
      filterOnly: true,
      filterOperators: ["contains"]
    },
    createCategoryColumn(
      "jobCategories",
      "",
      "/api/jobs/categories",
      {
        filterOnly: true,
        label: "Job Categories",
        expand: undefined,
        getCustomFilterString: (_, value) => `jobs/any(j:${getCategoryFilterString(value, "j/jobCategories")})`,
        autocompleteGroup: "Jobs"
      }
    )
  ];
};