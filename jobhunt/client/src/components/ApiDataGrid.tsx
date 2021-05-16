import React, { useCallback, useEffect, useRef, useState } from "react"
import { DataGrid, DataGridProps, GridFeatureModeConstant, GridPageChangeParams, GridRowData, GridRowId } from "@material-ui/data-grid"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Button, Grid, Box } from "@material-ui/core";

// have to remove the "rows" property since that shouldn't be passed to the DataGrid
type ApiDataGridProps = Omit<ApiDataGridPropsRows, "rows">;
type ApiDataGridPropsRows = DataGridProps & {
  url: string,
  queryParams?: [string, string | undefined][],
  toolbarActions?: ToolbarAction[]
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
  data?: GridRowData[],
  refresh: boolean
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    '& .MuiDataGrid-columnsContainer': {
      background: theme.palette.background.default,
      '& .MuiDataGrid-colCellTitle': {
        fontWeight: theme.typography.fontWeightBold
      }
    },
    "& a": {
      color: theme.palette.text.primary,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline"
      }
    }
  }
}));

const ApiDataGrid = (props:ApiDataGridProps) => {
  const [pageSettings, setPageSettings] = useState<PageSettings>({ page: 0, size: 10 });
  const [rows, setRows] = useState<GridRowData[]>([])
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const firstLoad = useRef<boolean>(true);
  const [selected, setSelected] = useState<GridRowId[]>([]);

  const classes = useStyles();

  const fetchData = useCallback(async () => {
    setLoading(true);
    let queryMap = [...(props.queryParams ?? [])].filter(p => p[0] !== "page" && p[0] !== "size" && p[0] !== "count");

    queryMap.push(["page", pageSettings.page.toString()]);
    queryMap.push(["size", pageSettings.size.toString()]);
    if (firstLoad.current) {
      queryMap.push(["count", "true"]);
    }

    let params: string[] = [];
    queryMap.forEach((v) => {
      if (v[1]) {
        params.push(`${v[0]}=${v[1]}`)
      }
    });
    const url = `${props.url}?${params.join("&")}`;

    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      if (data.total) {
        setRowCount(data.total)
      }
      setRows(data.results)
      setLoading(false);
      firstLoad.current = false;
    } else {
      console.error(`API request failed: ${url}, HTTP ${response.status}`);
    }
  }, [pageSettings, props.queryParams, props.url]);

  const handleToolbarResponse = useCallback(async (r: ToolbarActionResponse) => {
    if (r.refresh) {
      fetchData();
      setSelected([]);
    } else if (r.data) {
      let modified = false;
      let newRows = [...rows];

      r.data.forEach(data => {
        const rowIndex = newRows.indexOf((row: GridRowData) => row["id"] === data.id);
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

  useEffect(() => { fetchData() }, [pageSettings, fetchData]);

  return (
    <DataGrid
      pagination
      pageSize={pageSettings.size}
      rowsPerPageOptions={[10, 15, 20, 50]}
      paginationMode={GridFeatureModeConstant.server}
      onPageChange={(params: GridPageChangeParams) => { setPageSettings({ ...pageSettings, page: params.page }); setSelected([]); }}
      onPageSizeChange={(params: GridPageChangeParams) => { setPageSettings({ ...pageSettings, size: params.pageSize }); setSelected([]); }}
      autoHeight
      ref={React.createRef()}
      {...props}
      rows={rows}
      rowCount={rowCount}
      loading={loading}
      className={classes.root + " " + props.className}
      selectionModel={selected}
      onSelectionModelChange={(s) => setSelected(s.selectionModel)}
      components={{ Toolbar: props.toolbarActions ? ApiDataGridToolbar : undefined }}
      componentsProps={{
        toolbar: {
          actions: props.toolbarActions,
          selected: selected,
          handleResponse: handleToolbarResponse
        }}}
    />
  )
}

type ApiDataGridToolbarProps = {
  actions?: ToolbarAction[],
  selected: GridRowId[],
  handleResponse: (r: ToolbarActionResponse) => void
}

const ApiDataGridToolbar = (props: ApiDataGridToolbarProps) => {
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

export default ApiDataGrid;