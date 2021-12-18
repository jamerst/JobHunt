import React, { Fragment, useCallback, useEffect, useState } from "react"
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

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const { onSearch, disableHistory } = props;
  const search = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      const result = filter();

      if (result.filter) {
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

  useEffect(() => {
    if (disableHistory !== true) {
      const handlePopState = (e: PopStateEvent) => {
        let filter, obj, queryString;

        if (e.state.filterBuilder) {
          if (e.state.filterBuilder.reset === true) {
            reset(true);
          }

          filter = e.state.filterBuilder.filter as string;
          obj = e.state.filterBuilder.serialised as Group;
          queryString = e.state.filterBuilder.queryString as QueryStringCollection;
        }

        if (filter && obj) {
          if (onSearch) {
            onSearch(filter, obj, queryString);
          }

          const [tree, clauses] = deserialise(obj);

          setClauses(clauses);
          setTree(tree);
        }
      }

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [onSearch, setClauses, setTree, disableHistory, reset]);

  useMountEffect(() => {
    setClauses((old) => old.update(rootConditionUuid, (c) => ({ ...c as ConditionClause, field: props.schema[0].field })));
    setProps(props);
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