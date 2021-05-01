import React, { Fragment } from "react"
import { AppBar, Grid, IconButton, Toolbar, Tooltip, Typography } from "@material-ui/core"
import { Menu, BrightnessHigh, Brightness2  } from "@material-ui/icons";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

type MainLayoutProps = {
  darkMode: boolean,
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>,
  pageTitle?: string
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  mainContainer: {
    width: "1200px",
    maxWidth: "100%",
    margin: "2em auto",
    marginBottom: "0"
  },
  themeIcon: {
    color: "inherit"
  }
}));

const MainLayout = (props: React.PropsWithChildren<MainLayoutProps>) => {
  const classes = useStyles();

  return (
    <Fragment>
      <AppBar position="sticky">
        <Toolbar>
          <Grid container direction="row" justify="space-between" alignItems="center">
            <Grid container item alignItems="center" xs>
              <IconButton edge="start" color="inherit" aria-label="menu">
                <Menu/>
              </IconButton>
              <Typography variant="h6">{props.pageTitle ? props.pageTitle : "JobHunt"}</Typography>
            </Grid>
            <Tooltip title="Toggle theme">
              <IconButton
                aria-label="Toggle theme"
                className={classes.themeIcon}
                onClick={() => { props.setDarkMode(!props.darkMode); localStorage.setItem("theme", props.darkMode ? "light" : "dark") }}
              >
                {props.darkMode ? <BrightnessHigh /> : <Brightness2 />}
              </IconButton>
            </Tooltip>
          </Grid>
        </Toolbar>
      </AppBar>
      <Grid container direction="column" className={classes.mainContainer}>
        {props.children}
      </Grid>
    </Fragment>
  )
}

export default MainLayout;