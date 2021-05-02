import React, { Fragment } from "react"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Box, Grid, Paper, Typography } from "@material-ui/core";

type CardProps = {
  title?: string,
  subtitle?: string,
  icon?: React.ReactElement,
  colour?: string
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  bar: {
    backgroundColor: (props: CardProps) => props.colour ? props.colour : theme.palette.primary.main,
    color: "#fff",
    zIndex: 100,
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[5],
    display: (props: CardProps) => props.title ? "block": "inline-block",
    width: (props:CardProps) => props.title ? "auto" : "2em",
    height: (props:CardProps) => props.title ? "auto" : "2em",
  },
  icon: {
    fontSize: theme.typography.h3.fontSize,
    lineHeight: 1
  },
  subtitle: {
    color: "rgba(255,255,255,.9)"
  }
}));

const Card = (props: React.PropsWithChildren<CardProps>) => {
  const classes = useStyles(props);

  if (!props.title) {
    return (
      <Fragment>
        <Box mx={3} p={3} className={classes.bar + " " + classes.icon}>
          {props.icon ? props.icon : null}
        </Box>
        <Paper>
          <Box mt={-9} p={3} pt={3}>
            {props.children}
          </Box>
        </Paper>
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <Box mx={3} px={3} py={2} className={classes.bar}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item className={classes.icon}>
              {props.icon ? props.icon : null}
            </Grid>
            <Grid item>
              {props.title ? (<Typography variant="h6">{props.title}</Typography>) : null}
              {props.subtitle ? (<Typography className={classes.subtitle} variant="subtitle2">{props.subtitle}</Typography>) : null}
            </Grid>
          </Grid>
        </Box>
        <Paper>
          <Box mt={-9} p={3} pt={12}>
            {props.children}
          </Box>
        </Paper>
      </Fragment>
    );
  }
}

export default Card;