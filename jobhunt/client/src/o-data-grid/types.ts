
import { DataGridProps, GridSortModel, GridColDef, GridRowModel, GridLocaleText } from "@mui/x-data-grid"
import { ResponsiveValues } from "utils/hooks"
import { ExternalBuilderProps, FieldDef, FilterBuilderLocaleText } from "./FilterBuilder/types"

export type ODataGridProps =
  Omit<DataGridProps,
    "columns"
    | "rows"
    | "rowCount"
    | "pagination"
    | "paginationMode"
    | "page"
    | "pageSize"
    | "onPageChange"
    | "onPageSizeChange"
    | "loading"
    | "sortingMode"
    | "sortModel"
    | "disableColumnFilter"
    | "onFilterModelChange"
  >
  &
  {
    url: string,
    queryParams?: [string, string | undefined][],
    columns: ODataGridColDef[],
    idField?: string,
    alwaysFetch?: string[],
    $filter?: string,
    defaultSortModel?: GridSortModel,
    disableFilterBuilder?: boolean,
    filterBuilderProps?: ExternalBuilderProps,
    defaultPageSize?: number,
    disableHistory?: boolean
  };

export type ODataGridColDef = Omit<GridColDef, "hide" | "filterOperators" | "sortComparator"> & FieldDef & {
  select?: string,
  expand?: Expand,
  hide?: ResponsiveValues<boolean> | boolean,
  filterOnly?: boolean
}

export type ODataResponse = {
  "@odata.count"?: number,
  value: GridRowModel[]
}

export type Expand = {
  navigationField: string,
  select?: string,
  expand?: Expand,
  orderBy?: string,
  top?: number,
  count?: boolean
}

export type ValueOption = string | number | SelectOption;

export type SelectOption = {
  value: any,
  label: string
}