
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
    | "selectionModel"
    | "onSelectionModelChange"
    | "sortingMode"
    | "sortModel">
  &
  {
    url: string,
    queryParams?: [string, string | undefined][],
    columns: ODataGridColDef[],
    idField?: string,
    $filter?: string,
    defaultSortModel?: GridSortModel,
    disableFilterBuilder?: boolean,
    filterBuilderProps?: ExternalBuilderProps
  };

export type ODataGridColDef = Omit<GridColDef, "hide" | "filterOperators"> & FieldDef & {
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
  expand?: Expand
}

export type PageSettings = {
  page: number,
  size: number
}

export type ValueOption = string | number | SelectOption;

export type SelectOption = {
  value: any,
  label: string
}