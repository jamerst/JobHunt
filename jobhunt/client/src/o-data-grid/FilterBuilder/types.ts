import { DatePickerProps, DateTimePickerProps } from "@mui/lab";
import { TextFieldProps } from "@mui/material";

export type Schema = {
  filterable?: boolean,
  filterOperators?: Operation[],
  textFieldProps?: TextFieldProps,
  datePickerProps?: DatePickerProps,
  dateTimePickerProps?: DateTimePickerProps,
  nullable?: boolean,
}

export type Connective = "and" | "or"

export type Operation = "eq" | "ne" | "gt" | "lt" | "ge" | "le" | "contains"

export type CollectionOperation = "any" | "all"

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