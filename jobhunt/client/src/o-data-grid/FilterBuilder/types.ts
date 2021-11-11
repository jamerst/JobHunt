import { DatePickerProps, DateTimePickerProps } from "@mui/lab";
import { TextFieldProps } from "@mui/material";
import { GridValueOptionsParams } from "@mui/x-data-grid";
import { ValueOption } from "o-data-grid/types";

export type ExternalBuilderProps = {
  initialFilter?: Group,
  searchMenuItems?: ({ label: string, onClick: () => void })[]
}

export type FieldDef = {
  field: string,
  headerName?: string,
  type?: string,
  filterable?: boolean,
  filterOperators?: Operation[],
  textFieldProps?: TextFieldProps,
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  nullable?: boolean,
  collection?: boolean,
  collectionFields?: CollectionFieldDef[],
  valueOptions?: ValueOption[] | ((params: GridValueOptionsParams) => ValueOption[])
}

export type CollectionFieldDef = {
  field: string,
  label: string,
  type?: string,
  filterOperators?: Operation[],
  textFieldProps?: TextFieldProps,
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  nullable?: boolean,
  valueOptions?: ValueOption[] | ((params: GridValueOptionsParams) => ValueOption[])
}

export type Connective = "and" | "or"

export type Operation = "eq" | "ne" | "gt" | "lt" | "ge" | "le" | "contains" | "null" | "notnull"

export type CollectionOperation = "any" | "all" | "count"

type Clause = {
  id: string
}

export type Group = Clause & {
  connective: Connective
}

export type Condition = Clause & {
  field: string,
  op: Operation;
  collectionOp?: CollectionOperation,
  collectionField?: string,
  value: any,
  complement?: boolean
}

export type TreeGroup = Clause & {
  children: TreeChildren
}

export type TreeChildren = Immutable.Map<string, TreeGroup | string>;