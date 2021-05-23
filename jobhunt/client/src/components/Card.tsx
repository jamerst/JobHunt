import React, { Fragment, FunctionComponent } from "react"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Paper } from "@material-ui/core";

type CardProps = {
  className?: string
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  paper: {
    display: "flex",
    flexDirection: "column",
    marginTop: theme.spacing(3)
  }
}));

const Card: FunctionComponent<CardProps> = (props) => {
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