import React, { useCallback, useMemo } from "react"
import { useRecoilState, useSetRecoilState } from "recoil";

import FilterInputs from "./FilterInputs";

import { Condition, Operation } from "../types"

import { clauseState, treeState } from "../state"


type FilterConditionProps = {
  clauseId: string,
  path: string[],
}

const FilterCondition = ({ clauseId, path }: FilterConditionProps) => {
  const [clauses, setClauses] = useRecoilState(clauseState);
  const setTree = useSetRecoilState(treeState)

  const condition = useMemo(() => clauses.get(clauseId) as Condition, [clauses, clauseId]);

  const changeField = useCallback((f: string) => {
    setClauses(old => old.update(clauseId, c => ({ ...c as Condition, field: f })));
  }, [setClauses, clauseId]);

  const changeOp = useCallback((o: Operation) => {
    setClauses(old => old.update(clauseId, c => ({ ...c as Condition, op: o })));
  }, [setClauses, clauseId]);

  const changeValue = useCallback((v?: string) => {
    setClauses(old => old.update(clauseId, c => ({ ...c as Condition, value: v })));
  }, [setClauses, clauseId]);

  const remove = useCallback(() => {
    setTree(old => old.deleteIn([...path, clauseId]));
    setClauses(old => old.remove(clauseId));
  }, [setClauses, setTree, clauseId, path])

  if (!condition) {
    return null;
  }

  return (
    <FilterInputs
      field={condition.field}
      onFieldChange={changeField}
      op={condition.op}
      onOpChange={changeOp}
      value={condition.value}
      onValueChange={changeValue}
      onRemove={remove}
    />
  );
}

export default FilterCondition;