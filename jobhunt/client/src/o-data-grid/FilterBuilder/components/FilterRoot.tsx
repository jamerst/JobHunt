import React, { Fragment, useEffect } from "react"
import { useSetRecoilState } from "recoil";

import FilterGroup from "./FilterGroup";

import { schemaState } from "../state"

import { rootGroupUuid } from "../constants"
import { FilterBuilderProps } from "./FilterBuilder";

type FilterRootProps = {
  props: FilterBuilderProps
}

const FilterRoot = ({ props }: FilterRootProps) => {
  const setSchema = useSetRecoilState(schemaState);

  useEffect(() => {
    setSchema(props.schema);
  }, [props.schema, setSchema]);

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