import React, { useCallback, useMemo } from "react"
import { Button, ButtonGroup } from "@mui/material";

import Grid from "components/Grid";
import { ODataGridColDef } from "components/ODataGrid";

import { defaultCondition, defaultGroup, ODataConnective, ODataFilterCondition, ODataFilterGroup } from "./FilterBuilder";
import FilterCondition from "./FilterCondition";
import { Add } from "@mui/icons-material";
import makeStyles from "makeStyles";

type FilterGroupProps = {
  group: ODataFilterGroup,
  onChange: (g: ODataFilterGroup) => void,
  onRemove: () => void,
  columns: ODataGridColDef[],
  parentKey: string,
  root?: boolean
}

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

const FilterGroup = ({ group, onChange, onRemove, columns, parentKey, root }: FilterGroupProps) => {
  const { classes } = useStyles();

  const updateChild = useCallback((c: ODataFilterGroup | ODataFilterCondition, i: number) => {
    let newChildren = [...group.children];
    newChildren[i] = c;

    onChange({ ...group, children: newChildren });
  }, [group, onChange]);

  const addChild = useCallback((c: ODataFilterGroup | ODataFilterCondition) => {
    let newChildren = [...group.children];
    newChildren.push(c);

    onChange({ ...group, children: newChildren });
  }, [group, onChange]);

  const removeChild = useCallback((i: number) => {
    let newChildren = [...group.children];
    newChildren.splice(i, 1);

    if (newChildren.length === 0) {
      onRemove();
    } else {
      onChange({ ...group, children: newChildren });
    }

  }, [group, onChange, onRemove]);

  const setConnective = useCallback((c: ODataConnective) => {
    if (group.connective !== c) {
      onChange({ ...group, connective: c });
    }
  }, [group, onChange]);

  const multiple = useMemo(() => {
    return group.children.length > 1;
  }, [group]);

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
            <Button startIcon={<Add/>} onClick={() => addChild(defaultCondition)}>Add Condition</Button>
            <Button startIcon={<Add/>} onClick={() => addChild(defaultGroup)} >Add Group</Button>
          </ButtonGroup>
        </Grid>
      </Grid>
      <Grid item container xs direction="column" spacing={1} paddingLeft={multiple ? 3 : 0}>
        {group.children.map((c, i) => {
          const group = c as ODataFilterGroup;
          const condition = c as ODataFilterCondition;
          if (group.connective !== undefined) {
            return (
              <Grid item xs className={multiple ? classes.child : ""} key={`${parentKey}-${i}`}>
                <FilterGroup
                  group={group}
                  onChange={(g) => updateChild(g, i)}
                  onRemove={() => removeChild(i)}
                  columns={columns}
                  parentKey={`${parentKey}-${i}`}
                />
              </Grid>
            );
          } else {
            return (
              <Grid item xs className={multiple ? classes.child : ""} key={`${parentKey}-${i}`}>
                <FilterCondition
                  columns={columns}
                  condition={condition}
                  onChange={(c) => updateChild(c, i)}
                  onRemove={() => removeChild(i)}
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