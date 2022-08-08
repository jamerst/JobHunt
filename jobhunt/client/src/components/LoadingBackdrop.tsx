import React, { useCallback, useContext, useEffect, useState } from "react";
import { Backdrop, CircularProgress, Grow, Paper, Typography } from "@mui/material";
import makeStyles from "makeStyles";
import { Check } from "@mui/icons-material";
import Grid from "./Grid";
import LoadingContext from "context/LoadingContext";

type LoadingBackdropProps = {
  loading: boolean,
  success: boolean,
  error: boolean
}

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

const LoadingBackdrop = ({ loading, success, error }: LoadingBackdropProps) => {
  const state = useContext(LoadingContext);

  const [open, setOpen] = useState(loading || success || error);

  const { classes } = useStyles();

  const handleClick = useCallback(() => {
    if (success || error) {
      setOpen(false);
      state.setLoading(false);
      state.setSuccess(false);
      state.setError(false);
    }
  }, [success, error, state]);

  useEffect(() => {
    setOpen(loading || success || error);

    if (success) {
      setTimeout(() => {
        setOpen(false);
        state.setLoading(false);
        state.setSuccess(false);
        state.setError(false);
      }, 750);
    }
  }, [loading, success, error, state]);

  return (
    <Backdrop open={open} className={classes.backdrop} onClick={handleClick}>
      {loading && !success && !error && <CircularProgress size="10em" className={classes.progress} />}
      {success && <Grow in={success}><Check className={classes.check} /></Grow>}
      {error &&
        <Grow in={error}>
          <Grid container direction="column" alignItems="center" spacing={3}>
            <Grid item><Typography variant="h1" className={classes.error}>!</Typography></Grid>
            <Grid item><Paper className={classes.errorPaper}><Typography variant="body1">An error has occurred. Please try again or report this problem if it continues.</Typography></Paper></Grid>
          </Grid>
        </Grow>}
    </Backdrop>
  );
}

export default LoadingBackdrop;