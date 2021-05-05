import React, { Fragment, FunctionComponent } from "react"
import { createStyles, makeStyles, Theme, TypographyVariant } from "@material-ui/core/styles"
import { Box, Grid, Paper, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) => createStyles({
  paper: {
    display: "flex",
    flexDirection: "column",
    marginTop: theme.spacing(3)
  }
}));

const Card: FunctionComponent = (props) => {
  const classes = useStyles(props);

  return (
    <Fragment>
      <Paper className={classes.paper}>
          {props.children}
      </Paper>
    </Fragment>
  );
}

export default Card;