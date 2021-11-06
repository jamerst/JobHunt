import React, { Fragment, useState } from "react"
import FilterGroup from "./FilterGroup";
import { ODataGridColDef } from "./ODataGrid";

type ODataFilterBuilderProps = {
  columns: ODataGridColDef[],
  setFilter: React.Dispatch<React.SetStateAction<ODataFilterGroup | undefined>>,
  initialFilter?: ODataFilterGroup,
}

export type ODataConnective = "and" | "or"

export type ODataOperation = "eq" | "ne" | "gt" | "lt" | "ge" | "le" | "contains"

export type ODataCollectionOperation = "any" | "all"

export type ODataFilterGroup = {
  connective: ODataConnective,
  children: (ODataFilterGroup | ODataFilterCondition)[]
}

export type ODataFilterCondition = {
  field: string,
  op: ODataOperation;
  collectionOp?: ODataCollectionOperation,
  collectionField?: string,
  value?: string,
  complement?: boolean
}

export const defaultCondition: ODataFilterCondition = { "field": "", "op": "eq" };

export const defaultGroup: ODataFilterGroup = {
  connective: "and",
  children: [defaultCondition]
}

const FilterBuilder = (props: ODataFilterBuilderProps) => {
  const [filter, setFilter] = useState(props.initialFilter ?? defaultGroup);

  return (
    <Fragment>
      <FilterGroup group={filter} onChange={(g) => setFilter(g)} onRemove={() => setFilter(defaultGroup)} columns={props.columns} parentKey="" root/>
    </Fragment>
  );
}

export default FilterBuilder;