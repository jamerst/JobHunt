import React, { useCallback, useEffect, useState } from "react"
import { DataGrid, GridColDef, GridFeatureModeConstant, GridPageChangeParams, GridRowData } from "@material-ui/data-grid"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

type ApiDataGridProps = {
  columns: GridColDef[],
  url: string,
  queryParams?: Map<string, string>
}

type PageSettings = {
  page: number,
  size: number
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    '& .MuiDataGrid-columnsContainer': {
      background: theme.palette.background.default,
      '& .MuiDataGrid-colCellTitle': {
        fontWeight: theme.typography.fontWeightBold
      }
    }
  }
}));

const ApiDataGrid = (props:ApiDataGridProps) => {
  const [pageSettings, setPageSettings] = useState<PageSettings>({ page: 0, size: 10 });
  const [rows, setRows] = useState<GridRowData[]>([])
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const classes = useStyles();

  const fetchData = useCallback(async () => {
    setLoading(true);
    let queryMap;
    if (props.queryParams) {
      queryMap = new Map<string, string>(props.queryParams);
    } else {
      queryMap = new Map<string, string>();
    }

    queryMap.set("page", pageSettings.page.toString());
    queryMap.set("size", pageSettings.size.toString());

    let params: string[] = [];
    queryMap.forEach((v,k) => params.push(`${k}=${v}`));
    const url = `${props.url}?${params.join("&")}`;

    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      setRows(data.results)
      setRowCount(data.total)
      setLoading(false);
    } else {
      console.error(`API request failed: ${url}, HTTP ${response.status}`);
    }
  }, [pageSettings.page, pageSettings.size, props.queryParams, props.url]);

  useEffect(() => { fetchData() }, [pageSettings, fetchData]);

  return (
    <DataGrid
      rows={rows}
      columns={props.columns}
      pagination
      pageSize={pageSettings.size}
      rowsPerPageOptions={[10, 15, 20, 50]}
      paginationMode={GridFeatureModeConstant.server}
      rowCount={rowCount}
      onPageChange={(params: GridPageChangeParams) => { setPageSettings({ ...pageSettings, page: params.page }) }}
      onPageSizeChange={(params: GridPageChangeParams) => { setPageSettings({ ...pageSettings, size: params.pageSize }) }}
      autoHeight
      loading={loading}
      className={classes.root}
    />
  )
}

export default ApiDataGrid;