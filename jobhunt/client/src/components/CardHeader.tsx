import React, { PropsWithChildren, ReactElement } from "react"
import { Box, } from "@mui/material";
import Grid from "components/Grid";
import makeStyles from "makeStyles";

type CardHeaderProps = {
  variant?: "icon" | "text",
  icon?: ReactElement,
  colour?: string
}

const useStyles = makeStyles<CardHeaderProps>()((theme, props) => ({
  bar: {
    backgroundColor: props.colour ? props.colour : theme.palette.primary.main,
    color: theme.palette.getContrastText(props.colour ? props.colour : theme.palette.primary.main),
    zIndex: 100,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[5],
    display: props.variant === "text" ? "block": "inline-block",
    width: props.variant === "text" ? "auto" : "2em",
    height: props.variant === "text" ? "auto" : "2em",
    position: props.variant === "text" ? "static" : "absolute",
    "& *": {
      color: "inherit"
    }
  },
  icon: {
    fontSize: theme.typography.h3.fontSize,
    lineHeight: 1
  },
  subtitle: {
    color: "rgba(255,255,255,.9)"
  }
}));

const CardHeader = ({ children, icon, colour, variant = "text" }: PropsWithChildren<CardHeaderProps>) => {
  const { classes, cx } = useStyles({ variant, icon, colour });

  if (variant === "text") {
    return (
      <Box sx={{mx: { xs: 1, md: 3}}} mt={-3} px={3} py={2} className={classes.bar}>
        <Grid container alignItems="center" spacing={2}>
          {icon ? (<Grid item className={classes.icon}>{icon}</Grid>) : null}
          <Grid item xs={12}>
            {children}
          </Grid>
        </Grid>
      </Box>
    )
  } else {
    return (
      <Box mx={3} mt={-3} p={3} className={cx(classes.bar, classes.icon)}>
        {icon ? icon : null}
      </Box>
    )
  }
}


export default CardHeader;