import React from "react"
import { RecoilRoot } from "recoil";

import FilterRoot from "./FilterRoot";

import { ODataGridColDef } from "../../types";
import { Group } from "../types"

export type FilterBuilderProps = {
  columns: ODataGridColDef[],
  initialFilter?: Group
}

const FilterBuilder = (props: FilterBuilderProps) => {
  return (
    <RecoilRoot override>
      <FilterRoot props={props}/>
    </RecoilRoot>
  );
}

export default FilterBuilder;