import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DataGrid, GridColDef, GridFeatureModeConstant, GridRowModel, GridColumnVisibilityChangeParams, GridSortModel, GridOverlay } from "@mui/x-data-grid"
import { LinearProgress, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { o, OdataQuery } from "odata"
import { useLocation } from "react-router";

import { ResponsiveValues, useResponsive } from "utils/hooks";

import FilterBuilder from "../FilterBuilder/components/FilterBuilder";

import { Expand, ODataGridProps, ODataGridColDef, PageSettings, ODataResponse } from "../types";

import { ExpandToQuery, Flatten, GroupArrayBy, GetPageSettingsOrDefault } from "../utils";

import { defaultPageSize } from "../constants";
import { QueryStringCollection } from "../FilterBuilder/types";
import { SearchOff } from "@mui/icons-material";


const ODataGrid = React.memo((props: ODataGridProps) => {
  const [pageSettings, setPageSettings] = useState<PageSettings>(GetPageSettingsOrDefault(props.defaultPageSize));
  const [rows, setRows] = useState<GridRowModel[]>([])
  const [rowCount, setRowCount] = useState<number>(0);
  const [fetchCount, setFetchCount] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortModel, setSortModel] = useState<GridSortModel | undefined>();
  const [filter, setFilter] = useState<string>(props.$filter ?? "");
  const [queryString, setQueryString] = useState<QueryStringCollection>();

  const [visibleColumns, setVisibleColumns] = useState<ODataGridColDef[]>(props.columns.filter(c => c.hide !== true));
  const [columnHideOverrides, setColumnHideOverrides] = useState<{ [key: string]: boolean }>({});

  const firstLoad = useRef<boolean>(true);
  const searchUpdated = useRef<boolean>(false);

  const r = useResponsive();

  const fetchData = useCallback(async () => {
    setLoading(true);

    // select all fields for visible columns
    const fields = new Set(
      visibleColumns
        .filter(c => c.expand === undefined && c.filterOnly !== true)
        .map(c => c.select ?? c.field)
    );

    // add id field if specified
    if (props.idField) {
      fields.add(props.idField);
    }

    // group all expands by the navigation field
    const groupedExpands = GroupArrayBy(
      visibleColumns
        .filter(c => !!c.expand)
        .map(c => c.expand!),
      (e) => e.navigationField
    );

    // construct a single expand for each navigation field, combining nested query options
    const expands: Expand[] = [];
    groupedExpands.forEach((e, k) => {
      expands.push({
        navigationField: k,
        top: e[0].top,
        orderBy: e[0].orderBy,
        count: e.some(e2 => e2.count),
        select: Array.from(new Set(e.filter(e2 => e2.select).map(e2 => e2.select))).join(","),
      });
    });

    const $select = Array.from(fields).join(",");
    const $expand = expands.map(e => ExpandToQuery(e)).join(",");
    const $top = pageSettings.size;
    const $skip = pageSettings.page * pageSettings.size;

    let query: OdataQuery = {
      $select,
      $expand,
      $top,
      $skip,
      $count: fetchCount,
      ...queryString
    }

    if (filter) {
      query.$filter = filter;
    }

    // set the default sort model if one is provided
    if (props.defaultSortModel && !sortModel) {
      setSortModel(props.defaultSortModel);
      return;
    }

    if (sortModel && sortModel.length > 0) {
      query.$orderby = sortModel.map(s => {
        const sortCol = props.columns.find(c => c.field === s.field);
        return `${sortCol!.sortField ?? sortCol!.field}${s.sort === "desc" ? " desc" : ""}`;
      }).join(",");
    }

    const rawResponse = await o(props.url)
      .get()
      .fetch(query);

    const response = rawResponse as Response;

    if (response?.ok ?? false) {
      let data = await response.json() as ODataResponse;

      // flatten object so that the DataGrid can access all the properties
      // i.e. { Person: { name: "John" } } becomes { "Person/name": "John" }
      let rows = data.value.map(v => Flatten(v, "/"));

      // extract id if data does not contain the "id" field already
      // DataGrid requires each row to have a unique "id" property
      if (props.idField) {
        rows = rows.map(r => { return { ...r, id: r[props.idField!] } });
      }

      if (data["@odata.count"]) {
        setRowCount(data["@odata.count"]);
        setFetchCount(false);
      }

      setRows(rows);
      setLoading(false);
      firstLoad.current = false;
    } else {
      console.error(`API request failed: ${response.url}, HTTP ${response.status}`);
    }
  }, [pageSettings, visibleColumns, sortModel, filter, fetchCount, queryString, props.url, props.idField, props.defaultSortModel, props.columns]);

  const handleBuilderSearch = useCallback((f: string, q: QueryStringCollection | undefined) => {
    setFilter(f);
    setQueryString(q);
    setFetchCount(true);

    if (props.filterBuilderProps?.onSearch) {
      props.filterBuilderProps.onSearch(f, q);
    }

    fetchData();
  }, [setFilter, props.filterBuilderProps, fetchData]);

  const { onColumnVisibilityChange, onSortModelChange } = props;

  const handleColumnVisibility = useCallback((params: GridColumnVisibilityChangeParams, event, details) => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(params, event, details);
    }

    if (visibleColumns) {
      if (params.isVisible) {
        // add to visibleColumns if column is now visible
        const index = props.columns.findIndex(c => c.field === params.field);
        if (index !== -1) {
          setColumnHideOverrides({ ...columnHideOverrides, [params.field]: false });

          setVisibleColumns([...visibleColumns, props.columns[index]]);
        } else {
          console.error(`Column ${params.field} not found`);
        }
      } else {
        // remove from visibleColumns if no longer visible
        const index = visibleColumns.findIndex(c => c.field === params.field);

        if (index !== -1) {
          setColumnHideOverrides({ ...columnHideOverrides, [params.field]: true });

          const newColumns = [...visibleColumns];
          newColumns.splice(index, 1);
          setVisibleColumns(newColumns);
        } else {
          console.error(`Column ${params.field} not found`);
        }
      }
    }
  }, [visibleColumns, props.columns, onColumnVisibilityChange, columnHideOverrides]);

  const handleSortModelChange = useCallback((model: GridSortModel, details) => {
    if (onSortModelChange) {
      onSortModelChange(model, details);
    }

    setSortModel(model);
  }, [onSortModelChange]);

  useEffect(() => { fetchData() }, [pageSettings, fetchData]);

  useEffect(() => {
    let changed = false;
    searchUpdated.current = false;
    const params = new URLSearchParams(window.location.search);

    // update page query string parameter
    const pageStr = params.get("page");
    if (pageStr) {
      const page = parseInt(pageStr, 10) - 1;
      // update if already exists and is different to settings
      if (page !== pageSettings.page) {
        if (page !== 0) {
          params.set("page", (pageSettings.page + 1).toString());
        } else {
          // remove if first page
          params.delete("page");
        }

        changed = true;
      }
    } else if (pageSettings.page !== 0) {
      // add if doesn't already exist and not on first page
      params.set("page", (pageSettings.page + 1).toString());
      changed = true;
    }

    // update page-size query string parameter
    const sizeStr = params.get("page-size");
    if (sizeStr) {
      const size = parseInt(sizeStr, 10);
      if (size !== pageSettings.size) {
        if (size !== defaultPageSize) {
          params.set("page-size", pageSettings.size.toString());
        } else {
          params.delete("page-size");
        }

        changed = true;
      }
    } else if (pageSettings.size !== defaultPageSize) {
      params.set("page-size", pageSettings.size.toString());
      changed = true;
    }

    // only run if modified and not the first load
    if (changed && !firstLoad.current) {
      searchUpdated.current = true;

      const search = params.toString();

      if (search) {
        window.history.pushState(null, "", `${window.location.pathname}?${search}${window.location.hash}`);
      } else {
        window.history.pushState(null, "", `${window.location.pathname}${window.location.hash}`);
      }
    }
  }, [pageSettings]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let settings = { ...pageSettings };
    let changed = false;

    const pageVal = params.get("page");
    // read page number from page query string parameter
    if (pageVal) {
      const page = parseInt(pageVal, 10) - 1;
      // update if different to setting
      if (page !== settings.page) {
        settings.page = page;
        changed = true;
      }
    } else if (settings.page !== 0) {
      // reset to first page if not provided
      settings.page = 0;
      changed = true;
    }

    const sizeVal = params.get("page-size");
    if (sizeVal) {
      const size = parseInt(sizeVal, 10);
      if (size !== settings.size) {
        settings.size = size;
        changed = true;
      }
    } else if (settings.size !== (props.defaultPageSize ?? defaultPageSize)) {
      settings.size = defaultPageSize;
      changed = true;
    }

    // only update if modified and there isn't a pending change to the query string
    // this is required to prevent cancelling out the change just made to pageSettings
    if (changed && !searchUpdated.current) {
      setPageSettings(settings);
    } else {
      searchUpdated.current = false;
    }
  }, [location, pageSettings, props.defaultPageSize]);

  const columns = useMemo(() => props.columns.filter(c => c.filterOnly !== true).map((c) => {
    let hide: boolean | undefined;
    const override = columnHideOverrides[c.field];
    if (override !== undefined) {
      hide = override;
    } else if (typeof c.hide === "boolean") {
      hide = c.hide;
    } else if (c.hide) {
      const responsive = c.hide as ResponsiveValues<boolean>
      hide = r(responsive);
    }

    return { ...c, hide: hide } as GridColDef;
  }), [props.columns, r, columnHideOverrides]);

  return (
    <Fragment>
      {
        props.$filter === undefined && props.disableFilterBuilder !== true &&
        <Box mb={2}>
          <FilterBuilder
            {...props.filterBuilderProps}
            schema={props.columns}
            onSearch={handleBuilderSearch}
          />
        </Box>
      }
      <DataGrid
        autoHeight
        ref={React.createRef()}
        components={{
          LoadingOverlay: LoadingOverlay,
          NoResultsOverlay: NoResultsOverlay,
          NoRowsOverlay: NoResultsOverlay
        }}

        {...props}

        columns={columns}

        rows={rows}
        rowCount={rowCount}

        pagination
        paginationMode={GridFeatureModeConstant.server}
        page={pageSettings.page}
        pageSize={pageSettings.size}
        rowsPerPageOptions={props.rowsPerPageOptions ?? [10, 15, 20, 50]}
        onPageChange={(page) => setPageSettings({ ...pageSettings, page: page })}
        onPageSizeChange={(page) => setPageSettings({ ...pageSettings, size: page })}

        loading={loading}

        onColumnVisibilityChange={handleColumnVisibility}

        sortingMode={GridFeatureModeConstant.server}
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
      />
    </Fragment>
  )
});

const LoadingOverlay = () => (
  <GridOverlay>
    <div style={{ position: "absolute", top: 0, width: "100%" }}>
      <LinearProgress/>
    </div>
  </GridOverlay>
)

const NoResultsOverlay = () => (
  <GridOverlay style={{ height: "100%" }}>
    <div style={{ height: "100%", display: "flex", fontSize: 75, flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: .5 }}>
      <SearchOff fontSize="inherit" />
      <Typography variant="h5">No Results</Typography>
    </div>
  </GridOverlay>
)

export default ODataGrid;