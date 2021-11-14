import { DatePickerProps, DateTimePickerProps } from "@mui/lab";
import { TextFieldProps } from "@mui/material";
import { GridValueOptionsParams } from "@mui/x-data-grid";
import { ValueOption } from "o-data-grid/types";

export type ExternalBuilderProps = {
  initialFilter?: GroupClause,
  searchMenuItems?: ({ label: string, onClick: () => void })[],
  onSearch?: (filter: string) => void;
}

export type BaseFieldDef = {
  field: string,
  label?: string,
  type?: string,
  filterable?: boolean,
  filterOperators?: Operation[],
  textFieldProps?: TextFieldProps,
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  nullable?: boolean,
  valueOptions?: ValueOption[] | ((params: GridValueOptionsParams) => ValueOption[]),
  caseSensitive?: boolean
}

export type FieldDef = BaseFieldDef & {
  headerName?: string,
  collection?: boolean,
  collectionFields?: CollectionFieldDef[],
}

export type CollectionFieldDef = BaseFieldDef & {

}

export type Connective = "and" | "or"

export type Operation = "eq" | "ne" | "gt" | "lt" | "ge" | "le" | "contains" | "null" | "notnull"

export type CollectionOperation = "any" | "all" | "count"

type Clause = {
  id: string
}

export type GroupClause = Clause & {
  connective: Connective
}

export type ConditionClause = Clause & {
  field: string,
  op: Operation;
  collectionOp?: CollectionOperation,
  collectionField?: string,
  value: any,
  default?: boolean
}

export type TreeGroup = Clause & {
  children: TreeChildren
}

export type TreeChildren = Immutable.Map<string, TreeGroup | string>;

export type Group = {
  connective: Connective,
  children: (Group | Connective)[]
}

export type Condition = {
  field: string,
  op: Operation;
  collectionOp?: CollectionOperation,
  collectionField?: string,
  value: any
}

export type StateClause = Immutable.Map<string, GroupClause | ConditionClause>;
export type StateTree = Immutable.Map<string, string | TreeGroup>;