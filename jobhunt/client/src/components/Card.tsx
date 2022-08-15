import React, { Fragment, PropsWithChildren } from "react"
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

const Card = ({ className, children }: PropsWithChildren<CardProps>) => {
  const { classes, cx } = useStyles();

  return (
    <Fragment>
      <Paper className={cx(classes.paper, className)}>
          {children}
      </Paper>
    </Fragment>
  );
}

export default Card;