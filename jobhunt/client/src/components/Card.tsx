import React, { Fragment, FunctionComponent } from "react"
import makeStyles from "makeStyles";
import { Paper } from "@mui/material";

type CardProps = {
  className?: string
}

const useStyles = makeStyles()((theme) => ({
  paper: {
    display: "flex",
    flexDirection: "column",
    marginTop: theme.spacing(3),
    "& .MuiDataGrid-columnHeaders": {
      background: theme.palette.background.default,
    }
  }
}));

const Card: FunctionComponent<CardProps> = (props) => {
  const { classes } = useStyles();

  return (
    <Fragment>
      <Paper className={classes.paper}>
          {props.children}
      </Paper>
    </Fragment>
  );
}

export default Card;