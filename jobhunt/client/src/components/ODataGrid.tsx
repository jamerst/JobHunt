import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Breakpoint, ResponsiveStyleValue } from "@mui/system";
import { DataGrid, DataGridProps, GridColDef, GridFeatureModeConstant, GridRowModel, GridRowId, GridColumnVisibilityChangeParams, GridSortModel } from "@mui/x-data-grid"
import makeStyles from "makeStyles";
import { Button, Box, useMediaQuery, useTheme } from "@mui/material";

import Grid from "components/Grid";

import { o, OdataQuery } from "odata"
import { Expand, ExpandToQuery, Flatten, GroupArrayBy } from "utils/odata";
import { useLocation } from "react-router";
import { useBreakpoints } from "utils/hooks";

// have to remove the "rows" property since that shouldn't be passed to the DataGrid
type ODataGridProps = Omit<
  ODataGridPropsRows,
  "rows"
  | "rowCount"
  | "pagination"
  | "paginationMode"
  | "page"
  | "pageSize"
  | "onPageChange"
  | "onPageSizeChange"
  | "loading"
  | "selectionModel"
  | "onSelectionModelChange"
  | "sortingMode"
  | "sortModel"
>;

type ODataGridPropsRows = Omit<DataGridProps, "columns"> & {
  url: string,
  queryParams?: [string, string | undefined][],
  toolbarActions?: ToolbarAction[],
  alwaysUpdateCount?: boolean,
  columns: ODataGridColDef[],
  idField?: string,
  $filter?: string,
  defaultSortModel?: GridSortModel
}

export type ODataGridColDef = GridColDef & {
  select?: string,
  expand?: Expand,
  // hide?: ResponsiveStyleValue<boolean>
  // breakpoints?: Partial<Record<Breakpoint, boolean>>
  // { [key in Breakpoint]: boolean }
} & Partial<Record<Breakpoint, boolean>>

const breakpoints: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "xxl"];

type PageSettings = {
  page: number,
  size: number
}

export type ToolbarAction = {
  text: string,
  icon?: React.ReactNode,
  onClick: (ids: number[]) => Promise<ToolbarActionResponse>
}

type ToolbarActionResponse = {
  data?: GridRowModel[],
  refresh: boolean
}

type ODataResponse = {
  "@odata.count"?: number,
  value: GridRowModel[]
}

const useStyles = makeStyles()((theme) => ({
  root: {
    '& .MuiDataGrid-columnsContainer': {
      background: theme.palette.background.default,
      '& .MuiDataGrid-colCellTitle': {
        fontWeight: theme.typography.fontWeightBold
      }
    },
    "& a": {
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline"
      }
    }
  }
}));

const getPageSettingsOrDefault = (): PageSettings => {
  let settings = { page: 0, size: _defaultPageSize };

  const params = new URLSearchParams(window.location.search);
  if (params.has("page") || params.has("page-size")) {
    const pageVal = params.get("page");
    if (pageVal) {
      settings.page = parseInt(pageVal, 10);
    }

    const sizeVal = params.get("page-size");
    if (sizeVal) {
      settings.size = parseInt(sizeVal, 10);
    }
  }

  return settings;
}

const _defaultPageSize = 10;

const ODataGrid = React.memo((props: ODataGridProps) => {
  const [pageSettings, setPageSettings] = useState<PageSettings>(getPageSettingsOrDefault());
  const [rows, setRows] = useState<GridRowModel[]>([])
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<GridRowId[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<ODataGridColDef[] | undefined>();
  const [sortModel, setSortModel] = useState<GridSortModel | undefined>();

  const firstLoad = useRef<boolean>(true);
  const searchUpdated = useRef<boolean>(false);

  const { classes, cx } = useStyles();

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (!visibleColumns) {
      setVisibleColumns(props.columns.filter(c => !c.hide));
      return;
    } else {
      // select all fields for visible columns
      const fields = new Set(
        visibleColumns
          .filter(c => c.expand === undefined)
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
          select: Array.from(new Set(e.map(e2 => e2.select))).join(",")
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
        $count: Boolean(firstLoad.current || props.alwaysUpdateCount)
      }

      if (props.$filter) {
        query.$filter = props.$filter;
      }

      // set the default sort model if one is provided
      if (props.defaultSortModel && !sortModel) {
        setSortModel(props.defaultSortModel);
        return;
      }

      if (sortModel && sortModel.length > 0) {
        query.$orderby = sortModel.map(s => `${s.field}${s.sort === "desc" ? " desc" : ""}`).join(",");
      }

      const rawResponse = await o(props.url)
        .get()
        .fetch(query);

      const response = rawResponse as Response;

      if (response?.ok ?? false) {
        let data = await response.json() as ODataResponse;

        // flatten object so that the DataGrid can access all the properties
        // i.e. { Person: { name: "John" } } becomes { "Person/name": "John" }
        let rows = data.value.map(v => Flatten(v, "", "/"));

        // extract id if data does not contain the "id" field already
        // DataGrid requires each row to have a unique "id" property
        if (props.idField) {
          rows = rows.map(r => { return { ...r, id: r[props.idField!] } });
        }

        if (data["@odata.count"]) {
          setRowCount(data["@odata.count"]);
        }

        setRows(rows);
        setLoading(false);
        firstLoad.current = false;
      } else {
        console.error(`API request failed: ${response.url}, HTTP ${response.status}`);
      }
    }

  }, [pageSettings, visibleColumns, sortModel, props.alwaysUpdateCount, props.columns, props.url, props.idField, props.$filter, props.defaultSortModel]);

  const handleToolbarResponse = useCallback(async (r: ToolbarActionResponse) => {
    if (r.refresh) {
      fetchData();
      setSelected([]);
    } else if (r.data) {
      let modified = false;
      let newRows = [...rows];

      r.data.forEach(data => {
        const rowIndex = newRows.indexOf((row: GridRowModel) => row["id"] === data.id);
        if (rowIndex > -1) {
          newRows[rowIndex] = data;
          modified = true;
        }
      });

      if (modified) {
        setRows(newRows);
        setSelected([]);
      }
    }
  }, [fetchData, rows]);

  const handleColumnVisibility = useCallback((params: GridColumnVisibilityChangeParams, event, details) => {
    if (props.onColumnVisibilityChange) {
      props.onColumnVisibilityChange(params, event, details);
    }

    if (visibleColumns) {
      if (params.isVisible) {
        // add to visibleColumns if column is now visible
        const index = props.columns.findIndex(c => c.field === params.field);
        if (index !== -1) {
          setVisibleColumns([...visibleColumns, props.columns[index]]);
        } else {
          console.error(`Column ${params.field} not found`);
        }
      } else {
        // remove from visibleColumns if no longer visible
        const index = visibleColumns.findIndex(c => c.field === params.field);

        if (index !== -1) {
          const newColumns = [...visibleColumns];
          newColumns.splice(index, 1);
          setVisibleColumns(newColumns);
        } else {
          console.error(`Column ${params.field} not found`);
        }
      }
    }
  }, [visibleColumns, props.columns, props.onColumnVisibilityChange]);

  const handleSortModelChange = useCallback((model: GridSortModel, details) => {
    if (props.onSortModelChange) {
      props.onSortModelChange(model, details);
    }

    setSortModel(model);
  }, []);

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
        if (size !== _defaultPageSize) {
          params.set("page-size", pageSettings.size.toString());
        } else {
          params.delete("page-size");
        }

        changed = true;
      }
    } else if (pageSettings.size !== _defaultPageSize) {
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
    } else if (settings.size !== _defaultPageSize) {
      settings.size = _defaultPageSize;
      changed = true;
    }

    // only update if modified and there isn't a pending change to the query string
    // this is required to prevent cancelling out the change just made to pageSettings
    if (changed && !searchUpdated.current) {
      setPageSettings(settings);
    } else {
      searchUpdated.current = false;
    }
  }, [location, pageSettings]);

  const theme = useTheme();
  const breakpoints = useBreakpoints();
  console.log(breakpoints);
  // const xsMatch = useMediaQuery(theme.breakpoints.up("xs"));
  // const smMatch = useMediaQuery(theme.breakpoints.up("sm"));
  // const mdMatch = useMediaQuery(theme.breakpoints.up("md"));
  // const lgMatch = useMediaQuery(theme.breakpoints.up("lg"));
  // const xlMatch = useMediaQuery(theme.breakpoints.up("xl"));
  // const xxlMatch = useMediaQuery(theme.breakpoints.up("xxl"));
  // console.log(theme.breakpoints.keys);
  // console.log(theme.breakpoints.keys.map(b => theme.breakpoints.up(b)));

  // const columns = useMemo(() => props.columns.map(c => { return {
  //   ...c,
  //   hide: c.hide
  //   // hide: c.xs && !xsMatch || c.sm && !smMatch || c.md && !mdMatch || c.lg && !lgMatch || c.xl && !xlMatch || c.xxl && !xxlMatch || c.hide
  // }}), [xsMatch, smMatch, mdMatch, lgMatch, xlMatch, xxlMatch]);

  // const theme = useTheme();
  // const columns = useMemo(() => {
  //   let newColumns = [...props.columns];
  //   newColumns.forEach(c => {
  //     if (c.breakpoints) {
  //       Object.keys(c.breakpoints).forEach(b => {
  //         if (c.breakpoints![b as Breakpoint] === false && !window.matchMedia(theme.breakpoints.down(b as Breakpoint)).matches) {
  //           c.hide = true;
  //           console.log("hidden");
  //         }
  //         else {
  //           console.log("visible");
  //         }
  //       })
  //     }
  //   })

  //   return newColumns;
  // }, [props.columns, theme])

  return (
    <DataGrid
      autoHeight
      ref={React.createRef()}

      {...props}

      // columns={columns}

      rows={rows}
      rowCount={rowCount}

      pagination
      paginationMode={GridFeatureModeConstant.server}
      page={pageSettings.page}
      pageSize={pageSettings.size}
      rowsPerPageOptions={props.rowsPerPageOptions ?? [10, 15, 20, 50]}
      onPageChange={(page) => { setPageSettings({ ...pageSettings, page: page }); setSelected([]); }}
      onPageSizeChange={(page) => { setPageSettings({ ...pageSettings, size: page }); setSelected([]); }}

      loading={loading}
      className={cx(classes.root, props.className)}

      selectionModel={selected}
      onSelectionModelChange={(s) => setSelected(s)}

      onColumnVisibilityChange={handleColumnVisibility}

      sortingMode={GridFeatureModeConstant.server}
      sortModel={sortModel}
      onSortModelChange={handleSortModelChange}

      components={{ ...props.components, Toolbar: props.toolbarActions ? ODataGridToolbar : undefined }}
      componentsProps={{
        ...props.componentsProps,
        toolbar: {
          actions: props.toolbarActions,
          selected: selected,
          handleResponse: handleToolbarResponse
        }
      }}
    />
  )
});

type ODataGridToolbarProps = {
  actions?: ToolbarAction[],
  selected: GridRowId[],
  handleResponse: (r: ToolbarActionResponse) => void
}

const ODataGridToolbar = (props: ODataGridToolbarProps) => {
  const handleClick = useCallback(async (a: (ids: number[]) => Promise<ToolbarActionResponse>) => {
    if (props.selected.length > 0) {
      const response = await a(props.selected.map(r => r.valueOf() as number));
      props.handleResponse(response);
    }
  }, [props]);

  if (!props.actions) {
    return null;
  } else {
    return (
      <Box m={1}>
        <Grid container spacing={1}>
          {props.actions.map(a => (
            <Grid item key={a.text}>
              <Button
                variant="text"
                size="small"
                startIcon={a.icon ?? undefined}
                onClick={() => handleClick(a.onClick)}
                disabled={props.selected.length === 0}
              >
                {a.text}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
}

export default ODataGrid;