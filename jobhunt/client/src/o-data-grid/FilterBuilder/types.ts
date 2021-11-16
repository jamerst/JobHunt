import React from "react";
import { DatePickerProps, DateTimePickerProps, LocalizationProviderProps } from "@mui/lab";
import { AutocompleteProps, FormControlProps, SelectProps, TextFieldProps } from "@mui/material";
import { GridValueOptionsParams } from "@mui/x-data-grid";
import { ValueOption } from "o-data-grid/types";

export type ExternalBuilderProps = {
  initialFilter?: GroupClause,
  searchMenuItems?: ({ label: string, onClick: () => void })[],
  onSearch?: (filter: string, queryString: QueryStringCollection | undefined) => void,
  autocompleteProps?: AutocompleteProps<any, any, any, any>,
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  localizationProviderProps?: LocalizationProviderProps,
  selectProps?: SelectProps,
  textFieldProps?: TextFieldProps,
}

export type BaseFieldDef = {
  field: string,
  filterField?: string,
  sortField?: string,
  label?: string,
  type?: string,
  filterType?: string,
  filterable?: boolean,
  filterOperators?: Operation[],
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  selectProps?: { selectProps?: SelectProps, formControlProps?: FormControlProps, label?: string },
  textFieldProps?: TextFieldProps,
  nullable?: boolean,
  valueOptions?: ValueOption[] | ((params: GridValueOptionsParams) => ValueOption[]),
  caseSensitive?: boolean,
  renderCustomFilter?: (value: any, setValue: (v: any) => void) => React.ReactNode,
  renderCustomInput?: (value: any, setValue: (v: any) => void) => React.ReactNode,
  getCustomFilterString?: (op: Operation, value: any) => string,
  getCustomQueryString?: (op: Operation, value: any) => QueryStringCollection
}

export type FieldDef = BaseFieldDef & {
  headerName?: string,
  collection?: boolean,
  collectionFields?: CollectionFieldDef[],
}

export type CollectionFieldDef = BaseFieldDef & {

}

export type QueryStringCollection = {
  [key: string]: string
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