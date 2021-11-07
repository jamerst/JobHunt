import React, { Fragment } from "react"
import { useRecoilState } from "recoil";

import FilterGroup from "./FilterGroup";

import { ODataGridColDef } from "../../types";
import { Group } from "../types"

import { columnsState } from "../../state"

import { rootGroupUuid } from "../constants"

type FilterBuilderProps = {
  columns: ODataGridColDef[],
  setFilter: React.Dispatch<React.SetStateAction<Group | undefined>>,
  initialFilter?: Group,
}

const FilterBuilder = (props: FilterBuilderProps) => {
  const [stateColumns, setColumns] = useRecoilState(columnsState);
  if (stateColumns.length === 0) {
    setColumns(props.columns);
  }

  return (
    <Fragment>
      <FilterGroup
        clauseId={rootGroupUuid}
        path={[]}
        root
      />
    </Fragment>
  );
}

export default FilterBuilder;