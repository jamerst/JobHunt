import React, { useCallback, useEffect, useRef, useState } from "react"
import { DataGrid, DataGridProps, GridColDef, GridFeatureModeConstant, GridRowModel, GridRowId, GridColumnVisibilityChangeParams, MuiEvent, GridCallbackDetails } from "@mui/x-data-grid"
import makeStyles from "makeStyles";
import { Button, Box } from "@mui/material";
import Grid from "components/Grid";

import { o } from "odata"
import { Expand, ExpandToQuery, GroupArrayBy } from "utils/odata";

// have to remove the "rows" property since that shouldn't be passed to the DataGrid
type ODataGridProps = Omit<ODataGridPropsRows, "rows">;
type ODataGridPropsRows = Omit<DataGridProps, "columns"> & {
  baseUrl: string,
  queryParams?: [string, string | undefined][],
  toolbarActions?: ToolbarAction[],
  alwaysUpdateCount?: boolean,
  columns: ODataGridColDef[],
  idSelector?: (r: GridRowModel) => any,
}

export type ODataGridColDef = GridColDef & {
  select?: string,
  expand?: Expand
}

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

const ODataGrid = (props: ODataGridProps) => {
  const [pageSettings, setPageSettings] = useState<PageSettings>({ page: 0, size: 10 });
  const [rows, setRows] = useState<GridRowModel[]>([])
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const firstLoad = useRef<boolean>(true);
  const [selected, setSelected] = useState<GridRowId[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<ODataGridColDef[] | undefined>();

  const { classes, cx } = useStyles();

  const fetchData = useCallback(async () => {
    setLoading(true);
    // let queryMap = [...(props.queryParams ?? [])].filter(p => p[0] !== "page" && p[0] !== "size" && p[0] !== "count");

    // queryMap.push(["page", pageSettings.page.toString()]);
    // queryMap.push(["size", pageSettings.size.toString()]);
    // if (firstLoad.current || props.alwaysUpdateCount) {
    //   queryMap.push(["count", "true"]);
    // }

    // let params: string[] = [];
    // queryMap.forEach((v) => {
    //   if (v[1]) {
    //     params.push(`${v[0]}=${v[1]}`)
    //   }
    // });

    if (!visibleColumns) {

      setVisibleColumns(props.columns.filter(c => !c.hide));
    } else {
      const $select = visibleColumns.map(c => c.select ?? c.field).join(",");

      const groupedExpands = GroupArrayBy(
        visibleColumns
          .filter(c => !!c.expand)
          .map(c => c.expand!),
        (e) => e?.navigationField
      );

      const expands: Expand[] = [];
      groupedExpands.forEach((e, k) => {
        expands.push({ navigationField: k, select: e.map(e2 => e2.select).join(",") });
      });
      const $expand = expands.map(e => ExpandToQuery(e)).join(",");

      const $top = pageSettings.size;
      const $skip = pageSettings.page * pageSettings.size;

      let data = await o(props.baseUrl)
        .get()
        .query({ $select, $expand, $top, $skip, $count: firstLoad.current || props.alwaysUpdateCount });

      if (props.idSelector) {
        data = (data as GridRowModel[]).map(r => { return { ...r, id: props.idSelector!(r) }});
      }

      setRows(data);
      setLoading(false);
      firstLoad.current = false;

      // const url = `${props.url}`;

      // const response = await fetch(url, { method: "GET" });
      // if (response.ok) {
      //   const data = await response.json();
      //   if (data.total) {
      //     setRowCount(data.total)
      //   }
      //   setRows(data.results)
      //   setLoading(false);
      //   firstLoad.current = false;
      // } else {
      //   console.error(`API request failed: ${url}, HTTP ${response.status}`);
      // }
    }

  }, [pageSettings, props.queryParams, props.alwaysUpdateCount, props.columns, visibleColumns]);

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

  const handleColumnVisibility = useCallback((params: GridColumnVisibilityChangeParams, event: MuiEvent, details: GridCallbackDetails) => {
    console.log(params);
    console.log(event);
    console.log(details);
  }, []);

  useEffect(() => { fetchData() }, [pageSettings, fetchData]);

  return (
    <DataGrid
      pagination
      pageSize={pageSettings.size}
      rowsPerPageOptions={[10, 15, 20, 50]}
      paginationMode={GridFeatureModeConstant.server}
      onPageChange={(page) => { setPageSettings({ ...pageSettings, page: page}); setSelected([]); }}
      onPageSizeChange={(page) => { setPageSettings({ ...pageSettings, size: page }); setSelected([]); }}
      autoHeight
      ref={React.createRef()}
      {...props}
      rows={rows}
      rowCount={rowCount}
      loading={loading}
      className={cx(classes.root, props.className)}
      selectionModel={selected}
      onSelectionModelChange={(s) => setSelected(s)}
      onColumnVisibilityChange={handleColumnVisibility}
      components={{ Toolbar: props.toolbarActions ? ODataGridToolbar : undefined }}
      componentsProps={{
        toolbar: {
          actions: props.toolbarActions,
          selected: selected,
          handleResponse: handleToolbarResponse
        }
      }}
    />
  )
}

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