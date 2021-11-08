import React, { useCallback, useMemo } from "react"
import { useRecoilState, useRecoilValue } from "recoil";
import { IconButton } from "@mui/material";
import { Remove } from "@mui/icons-material";

import Grid from "components/Grid";

import FilterInputs from "./FilterInputs";

import { Condition, Operation, TreeGroup } from "../types"

import { clauseState, treeState } from "../state"
import { columnsState } from "o-data-grid/state";
import { domainToUnicode } from "url";


type FilterConditionProps = {
  clauseId: string,
  path: string[],
}

const FilterCondition = ({ clauseId, path }: FilterConditionProps) => {
  const [clauses, setClauses] = useRecoilState(clauseState);
  const [tree, setTree] = useRecoilState(treeState);

  const columns = useRecoilValue(columnsState);

  const condition = useMemo(() => clauses.get(clauseId) as Condition, [clauses, clauseId]);

  const changeField = useCallback((oldField: string, currentOp: Operation, newField: string) => {
    const oldCol = columns.find(c => c.field === oldField);
    const newCol = columns.find(c => c.field === newField);

    setClauses(old => old.update(clauseId, c => {
      let condition = { ...c as Condition };
      condition.field = newField;

      if (oldCol && newCol) {
        // reset value if columns have different types
        if (oldCol.type !== newCol.type) {
          condition.value = "";
        }

        // reset operator if new column doesn't support current operator
        if (newCol.filterOperators && !newCol.filterOperators.includes(currentOp)) {
          condition.op = newCol.filterOperators[0] ?? "eq";
        }
      }

      return condition;
    }));
  }, [columns, setClauses, clauseId]);

  const changeOp = useCallback((o: Operation) => {
    setClauses(old => old.update(clauseId, c => ({ ...c as Condition, op: o })));
  }, [setClauses, clauseId]);

  const changeValue = useCallback((v?: string) => {
    setClauses(old => old.update(clauseId, c => ({ ...c as Condition, value: v })));
  }, [setClauses, clauseId]);

  const remove = useCallback(() => {
    // if not root group
    if (path.length > 2) {
      setTree(oldTree => oldTree.withMutations((old) => {
        // get path to parent node (i.e. remove "children" from end of path)
        let parentPath = [...path];
        parentPath.splice(-1, 1);
        do {
          const node = old.getIn(parentPath) as TreeGroup;
          // delete parent if empty
          if (node && node.children.count() <= 1) {
            old.deleteIn(parentPath);
          } else { // not the only child, so only remove self and stop
            old.deleteIn([...path, clauseId]);
            break;
          }

          parentPath.splice(-2, 2); // move up in path to next parent
        } while (parentPath.length > 2) // keep removing empty groups until root is reached
      }))
    } else {
      setTree(old => old.deleteIn([...path, clauseId]));
    }

    setClauses(old => old.remove(clauseId));
  }, [setClauses, tree, setTree, clauseId, path])

  if (!condition) {
    return null;
  }

  return (
    <Grid container spacing={1}>
      <FilterInputs
        clauseId={clauseId}
        field={condition.field}
        onFieldChange={changeField}
        op={condition.op}
        onOpChange={changeOp}
        value={condition.value}
        onValueChange={changeValue}
      />
      <Grid item xs="auto">
        <IconButton onClick={remove}>
          <Remove />
        </IconButton>
      </Grid>
    </Grid>
  );
}

export default FilterCondition;