import React, { useCallback, useEffect, useState } from "react"
import { useSetRecoilState } from "recoil";
import { ArrowDropDown } from "@mui/icons-material";
import { Button, ButtonGroup, MenuItem, MenuList, Paper, Popover } from "@mui/material";
import { Box } from "@mui/system";

import Grid from "components/Grid";

import FilterGroup from "./FilterGroup";

import { clauseState, schemaState, treeState } from "../state"

import { initialClauses, initialTree, rootGroupUuid } from "../constants"
import { FilterBuilderProps } from "./FilterBuilder";

type FilterRootProps = {
  props: FilterBuilderProps
}

const FilterRoot = ({ props }: FilterRootProps) => {
  const setClauses = useSetRecoilState(clauseState);
  const setSchema = useSetRecoilState(schemaState);
  const setTree = useSetRecoilState(treeState);

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const reset = useCallback(() => {
    setClauses(initialClauses);
    setTree(initialTree);
  }, [setClauses, setTree]);

  useEffect(() => {
    setSchema(props.schema);
  }, [props.schema, setSchema]);

  return (
    <Box my={2}>
      <FilterGroup
        clauseId={rootGroupUuid}
        path={[]}
        root
      />

      <Grid container spacing={1}>
        <Grid item>
          <ButtonGroup variant="contained" color="primary">
            <Button>Search</Button>
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
    </Box>
  );
}

export default FilterRoot;