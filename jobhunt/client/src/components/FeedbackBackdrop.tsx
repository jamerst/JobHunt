import React, { useCallback, useEffect } from "react";
import { Backdrop, CircularProgress, Grow, Paper, Typography } from "@mui/material";
import makeStyles from "makeStyles";
import { Check } from "@mui/icons-material";
import Grid from "./Grid";
import { useRecoilState } from "recoil";
import feedbackState from "state/FeedbackState";

const useStyles = makeStyles()((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.modal + 1
  },
  progress: {
    color: "#fff"
  },
  check: {
    fontSize: "10em",
    borderRadius: "50%",
    background: theme.palette.success.main
  },
  error: {
    fontSize: "10em",
    borderRadius: "50%",
    background: theme.palette.error.main,
    width: "1em",
    height: "1em",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: theme.typography.fontWeightBold
  },
  errorPaper: {
    padding: theme.spacing(2),
    maxWidth: "15em",
    textAlign: "center"
  }
}));

const FeedbackBackdrop = () => {
  const [state, setState] = useRecoilState(feedbackState);
  const { classes } = useStyles();

  const handleClick = useCallback(() => {
    if (state.success || state.error) {
      setState({ loading: false, success: false, error: false });
    }
  }, [state, setState]);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        setState({ loading: false, success: false, error: false });
      }, 1000);
    }
  }, [state, setState]);

  return (
    <Backdrop open={state.loading || state.success || state.error} className={classes.backdrop} onClick={handleClick}>
      {state.loading && !state.success && !state.error && <CircularProgress size="10em" className={classes.progress} />}
      {state.success && <Grow in={state.success}><Check className={classes.check} /></Grow>}
      {state.error &&
        <Grow in={state.error}>
          <Grid container direction="column" alignItems="center" spacing={3}>
            <Grid item><Typography variant="h1" className={classes.error}>!</Typography></Grid>
            <Grid item><Paper className={classes.errorPaper}><Typography variant="body1">An error has occurred. Please try again or report this problem if it continues.</Typography></Paper></Grid>
          </Grid>
        </Grow>}
    </Backdrop>
  );
}

export default FeedbackBackdrop;