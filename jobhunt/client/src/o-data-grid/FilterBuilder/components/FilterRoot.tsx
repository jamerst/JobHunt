import React, { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { useSetRecoilState } from "recoil";
import { ArrowDropDown } from "@mui/icons-material";
import { Button, ButtonGroup, MenuItem, MenuList, Paper, Popover } from "@mui/material";

import Grid from "components/Grid";

import FilterGroup from "./FilterGroup";

import { clauseState, propsState, schemaState, treeState } from "../state"

import { initialClauses, initialTree, rootConditionUuid, rootGroupUuid } from "../constants"
import { FilterBuilderProps } from "./FilterBuilder";
import { UseODataFilter } from "../hooks";
import { useMountEffect } from "utils/hooks";
import { ConditionClause, Group, QueryStringCollection } from "../types";
import { deserialise } from "../utils";

type FilterRootProps = {
  props: FilterBuilderProps
}

const FilterRoot = ({ props }: FilterRootProps) => {
  const setClauses = useSetRecoilState(clauseState);
  const setProps = useSetRecoilState(propsState);
  const setSchema = useSetRecoilState(schemaState);
  const setTree = useSetRecoilState(treeState);

  const filter = UseODataFilter();
  const currentFilter = useRef("");

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const { onSearch, disableHistory } = props;
  const search = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      const result = filter();

      if (result.filter && result.filter !== currentFilter.current) {
        currentFilter.current = result.filter;

        onSearch(result.filter, result.serialised, result.queryString);

        if (disableHistory !== true) {
          window.history.pushState({
              ...window.history.state,
              filterBuilder: {
                filter: result.filter,
                serialised: result.serialised,
                queryString: result.queryString
              }
            },
            ""
          );
        }
      }
    }
  }, [onSearch, filter, disableHistory]);

  const reset = useCallback((noHistory?: boolean) => {
    currentFilter.current = "";

    setClauses(initialClauses.update(rootConditionUuid, (c) => ({ ...c as ConditionClause, field: props.schema[0].field })));
    setTree(initialTree);

    if (onSearch) {
      onSearch("", undefined, {});
    }

    if (disableHistory !== true && noHistory !== true) {
      window.history.pushState({
        ...window.history.state,
        filterBuilder: {
          reset: true
        }
      }, "");
    }
  }, [setClauses, setTree, onSearch, props.schema, disableHistory]);

  const handleReset = useCallback(() => reset(), [reset]);

  useEffect(() => {
    setSchema(props.schema);
  }, [props.schema, setSchema]);

  const restoreState = useCallback((state: any, isPopstate: boolean) => {
    let filter, obj, queryString;

    if (state.filterBuilder) {
      if (state.filterBuilder.reset === true && isPopstate === true) {
        reset(true);
      }

      filter = state.filterBuilder.filter as string;
      obj = state.filterBuilder.serialised as Group;
      queryString = state.filterBuilder.queryString as QueryStringCollection;
    } else {
      return false;
    }

    if (filter && obj && filter !== currentFilter.current) {
      currentFilter.current = filter;

      if (onSearch) {
        onSearch(filter, obj, queryString);
      }

      const [tree, clauses] = deserialise(obj);

      setClauses(clauses);
      setTree(tree);
    }

    return true;
  }, [onSearch, setClauses, setTree, reset])

  useEffect(() => {
    if (disableHistory !== true) {
      const handlePopState = (e: PopStateEvent) => restoreState(e.state, true);

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [disableHistory, restoreState]);

  useMountEffect(() => {
    setProps(props);

    // set default state if history support is disabled, or if there is no state in the history
    if (disableHistory === true || !restoreState(window.history.state, false)) {
      setClauses((old) => old.update(rootConditionUuid, (c) => ({ ...c as ConditionClause, field: props.schema[0].field })));
    }
  });

  return (
    <Fragment>
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
            <Button variant="outlined" onClick={handleReset}>Reset</Button>
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

    </Fragment>
  );
}

export default FilterRoot;