import { DatePickerProps, DateTimePickerProps } from "@mui/lab";
import { TextFieldProps } from "@mui/material";
import { DataGridProps, GridSortModel, GridColDef, GridRowModel, GridValueOptionsParams } from "@mui/x-data-grid"
import { ResponsiveValues } from "utils/hooks"
import { Operation } from "./FilterBuilder/types"

export type ODataGridProps = Omit<
  ODataGridPropsFull,
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

type ODataGridPropsFull = Omit<DataGridProps, "columns"> & {
  url: string,
  queryParams?: [string, string | undefined][],
  toolbarActions?: ToolbarAction[],
  alwaysUpdateCount?: boolean,
  columns: ODataGridColDef[],
  idField?: string,
  $filter?: string,
  defaultSortModel?: GridSortModel,
  disableFilterBuilder?: boolean
}

export type ODataGridColDef = Omit<GridColDef, "hide" | "filterOperators" | "valueOptions"> & {
  select?: string,
  expand?: Expand,
  hide?: ResponsiveValues<boolean> | boolean,
  filterable?: boolean,
  filterOperators?: Operation[],
  collection?: boolean,
  collectionFields?: ({ field: string, label: string })[],
  textFieldProps?: TextFieldProps,
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  nullable?: boolean,
  valueOptions?: ValueOption[] | ((params: GridValueOptionsParams) => ValueOption[])
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

export type ToolbarAction = {
  text: string,
  icon?: React.ReactNode,
  onClick: (ids: number[]) => Promise<ToolbarActionResponse>
}

export type ToolbarActionResponse = {
  data?: GridRowModel[],
  refresh: boolean
}

export type ValueOption = string | number | SelectOption;

export type SelectOption = {
  value: string,
  label: string
}