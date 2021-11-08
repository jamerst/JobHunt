import React, { useCallback, useMemo } from "react"
import { useRecoilState } from "recoil";
import Immutable from "immutable";
import { Button, ButtonGroup } from "@mui/material";
import { Add } from "@mui/icons-material";

import Grid from "components/Grid";

import FilterCondition from "./FilterCondition";

import { Connective, Group, TreeChildren, TreeGroup } from "../types"

import { clauseState, treeState } from "../state"

import { getDefaultCondition, getDefaultGroup } from "../utils";

import makeStyles from "makeStyles";


const useStyles = makeStyles()((theme) => ({
  group: {
    borderWidth: 1,
    borderColor: theme.palette.mode === "dark" ? "rgb(81,81,81)" : "rgb(224,224,224)",
    borderRadius: theme.shape.borderRadius,
    borderStyle: "solid",
    padding: theme.spacing(2),
  },
  child: {
    position: "relative",
    "&:not(:last-of-type)::before": {
      content: "''",
      display: "block",
      position: "absolute",
      width: 2,
      height: "100%",
      background: theme.palette.primary.main,
      left: theme.spacing(-1),
    },
    "&:first-of-type::before": {
      height: `calc(100% + ${theme.spacing(2)})`,
      top: `calc(${theme.spacing(-1)} - 1px)`
    },
    "&::after": {
      content: "''",
      display: "block",
      position: "absolute",
      left: theme.spacing(-1),
      top: "4px",
      width: theme.spacing(2),
      height: "50%",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: theme.palette.primary.main,
      borderRight: "none",
      borderTop: "none",
      borderBottomLeftRadius: theme.shape.borderRadius
    }
  }
}));


type FilterGroupProps = {
  clauseId: string,
  path: string[],
  root?: boolean
}

const FilterGroup = ({ clauseId, path, root }: FilterGroupProps) => {
  const { classes } = useStyles();

  const [tree, setTree] = useRecoilState(treeState);
  const [clauses, setClauses] = useRecoilState(clauseState);

  const group = useMemo(() => clauses.get(clauseId) as Group, [clauses, clauseId]);
  const treeGroup = useMemo(() => tree.getIn([...path, clauseId]) as TreeGroup, [tree, path, clauseId]);

  const childrenPath = useMemo(() => [...path, clauseId, "children"], [path, clauseId]);

  const multiple = useMemo(() => treeGroup.children.count() > 1, [treeGroup]);

  const setConnective = useCallback((con: Connective) => {
    setClauses(clauses.update(clauseId, c => ({...c as Group, connective: con})))
  }, [clauses, setClauses, clauseId]);

  const addGroup = useCallback(() => {
    const group = getDefaultGroup();
    const condition = getDefaultCondition();

    setClauses(clauses
      .set(group.id, group)
      .set(condition.id, condition)
    );

    setTree(tree
      .updateIn(
        childrenPath,
        (list) => (list as TreeChildren).set(group.id, { id: group.id, children: Immutable.Map({ [condition.id]: condition.id }) })
      )
    );
  }, [clauses, setClauses, tree, setTree, childrenPath]);

  const addCondition = useCallback(() => {
    const condition = getDefaultCondition();

    setClauses(clauses.set(condition.id, condition));

    setTree(tree
      .updateIn(
        childrenPath,
        (list) => (list as TreeChildren).set(condition.id, condition.id)
      )
    );
  }, [clauses, setClauses, tree, setTree, childrenPath]);

  return (
    <Grid container marginY={2} paddingLeft={root ? 0 : 3} className={root ? "" : classes.group}>
      <Grid item container justifyContent={multiple ? "space-between" : "end"} alignItems="center" marginBottom={2}>
        {multiple && (
          <Grid item>
            <ButtonGroup size="small">
              <Button variant={group.connective === "and" ? "contained" : "outlined"} onClick={() => setConnective("and")}>And</Button>
              <Button variant={group.connective === "or" ? "contained" : "outlined"} onClick={() => setConnective("or")}>Or</Button>
            </ButtonGroup>
          </Grid>
        )}
        <Grid item>
          <ButtonGroup variant="contained" size="small">
            <Button startIcon={<Add/>} onClick={addCondition}>Add Condition</Button>
            <Button startIcon={<Add/>} onClick={addGroup} >Add Group</Button>
          </ButtonGroup>
        </Grid>
      </Grid>
      <Grid item container xs direction="column" spacing={1} paddingLeft={multiple ? 3 : 0} data-test="3">
        {treeGroup.children.toArray().map((c) => {
          if (typeof c[1] === "string") {
            return (
              <Grid item xs className={multiple ? classes.child : ""} key={c[0]} data-test="1">
                <FilterCondition
                  clauseId={c[0]}
                  path={childrenPath}
                />
              </Grid>
            );
          } else {
            return (
              <Grid item xs className={multiple ? classes.child : ""} key={c[0]} data-test="2">
                <FilterGroup
                  clauseId={c[0]}
                  path={childrenPath}
                />
              </Grid>
            );
          }
        })}
      </Grid>
    </Grid>
  )
}

export default FilterGroup;