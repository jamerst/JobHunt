import React, { Fragment, useEffect } from "react"
import { useSetRecoilState } from "recoil";

import FilterGroup from "./FilterGroup";

import { columnsState } from "../../state"

import { rootGroupUuid } from "../constants"
import { FilterBuilderProps } from "./FilterBuilder";

type FilterRootProps = {
  props: FilterBuilderProps
}

const FilterRoot = ({ props }: FilterRootProps) => {
  const setColumns = useSetRecoilState(columnsState);

  useEffect(() => {
    setColumns(props.columns);
  }, [props.columns, setColumns]);

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

export default FilterRoot;