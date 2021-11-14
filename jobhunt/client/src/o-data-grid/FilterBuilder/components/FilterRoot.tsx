import React, { useCallback, useEffect, useState } from "react"
import { useSetRecoilState } from "recoil";
import { ArrowDropDown } from "@mui/icons-material";
import { Button, ButtonGroup, MenuItem, MenuList, Paper, Popover } from "@mui/material";
import { Box } from "@mui/system";

import Grid from "components/Grid";

import FilterGroup from "./FilterGroup";

import { clauseState, schemaState, treeState } from "../state"

import { initialClauses, initialTree, rootConditionUuid, rootGroupUuid } from "../constants"
import { FilterBuilderProps } from "./FilterBuilder";
import { UseODataFilter } from "../hooks";
import { useMountEffect } from "utils/hooks";
import { ConditionClause } from "../types";

type FilterRootProps = {
  props: FilterBuilderProps
}

const FilterRoot = ({ props }: FilterRootProps) => {
  const setClauses = useSetRecoilState(clauseState);
  const setSchema = useSetRecoilState(schemaState);
  const setTree = useSetRecoilState(treeState);

  const filter = UseODataFilter();

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const { onSearch } = props;
  const search = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(filter());
    }
  }, [onSearch, filter]);

  const reset = useCallback(() => {
    setClauses(initialClauses.update(rootConditionUuid, (c) => ({ ...c as ConditionClause, field: props.schema[0].field })));
    setTree(initialTree);

    if (onSearch) {
      onSearch("");
    }
  }, [setClauses, setTree, onSearch, props.schema]);

  useEffect(() => {
    setSchema(props.schema);
  }, [props.schema, setSchema]);

  useMountEffect(() => {
    setClauses((old) => old.update(rootConditionUuid, (c) => ({ ...c as ConditionClause, field: props.schema[0].field })));
  });

  return (
    <Box my={2}>
      <form onSubmit={search}>
        <FilterGroup
          clauseId={rootGroupUuid}
          path={[]}
          root
        />

        <Grid container spacing={1}>
          <Grid item>
            <ButtonGroup variant="contained" color="primary">
              <Button type="submit">Search</Button>
              {
                props.searchMenuItems &&
                <Button
                  size="small"
                  onClick={(e) => setAnchor(e.currentTarget)}
                  aria-controls={anchor !== null ? "search-menu": undefined}
                  aria-expanded={anchor !== null ? "true": undefined}
                  aria-haspopup="menu"
                >
                  <ArrowDropDown/>
                </Button>
              }
            </ButtonGroup>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={reset}>Reset</Button>
          </Grid>
        </Grid>
        {
          props.searchMenuItems &&
          <Popover
            anchorEl={anchor}
            open={anchor !== null}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            onClose={() => setAnchor(null)}
            transitionDuration={100}
          >
            <Paper>
              <MenuList id="search-menu">
                {props.searchMenuItems.map((item, i) => (
                  <MenuItem
                    key={`searchMenu_${i}`}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </MenuItem>))}
              </MenuList>
            </Paper>
          </Popover>
        }
      </form>

    </Box>
  );
}

export default FilterRoot;