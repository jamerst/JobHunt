import React, { useMemo } from "react"
import { ODataGrid as DefaultDataGrid, ODataGridProps } from "o-data-grid"
import { SearchOff } from "@mui/icons-material";

import makeStyles from "makeStyles";
import { GridOverlay } from "@mui/x-data-grid";
import { LinearProgress, Typography } from "@mui/material";

const pageSizes = [10, 15, 20, 50];

const ODataGrid = (props: ODataGridProps) => {
  const slots = useMemo(() => ({
    ...props.slots,
    LoadingOverlay: LoadingOverlay,
    NoResultsOverlay: NoResultsOverlay,
    NoRowsOverlay: NoResultsOverlay
  }), [props.slots]);

  return (
    <DefaultDataGrid
      {...props}
      slots={slots}
      pageSizeOptions={props.pageSizeOptions ?? pageSizes}
    />
  )
}

const useLoadingStyles = makeStyles()(() => ({
  container: {
    position: "absolute",
    top: 0,
    width: "100%"
  }
}));

const LoadingOverlay = () => {
  const { classes } = useLoadingStyles();

  return (
    <GridOverlay>
      <div className={classes.container}>
        <LinearProgress />
      </div>
    </GridOverlay>
  )
}

const useNoResultsStyles = makeStyles()(() => ({
  overlay: {
    height: "100%"
  },
  container: {
    height: "100%",
    display: "flex",
    fontSize: 75,
    flexDirection: "column",
    alignItems: "center",
    opacity: .5
  }
}));

const NoResultsOverlay = () => {
  const { classes } = useNoResultsStyles();

  return (
    <GridOverlay className={classes.overlay}>
      <div className={classes.container}>
        <SearchOff fontSize="inherit" />
        <Typography variant="h5">No Results</Typography>
      </div>
    </GridOverlay>
  )
}

export default ODataGrid;