import React, { Fragment } from "react"
import { Divider, Drawer, Grid, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography } from "@material-ui/core"
import { BrightnessHigh, Brightness2, Work, Business, Search, Dashboard  } from "@material-ui/icons";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Link } from "react-router-dom";
import Alerts from "../components/Alerts";

type MainLayoutProps = {
  darkMode: boolean,
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>,
  pageTitle?: string
}

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    width: "100vw"
  },
  mainContainer: {
    marginLeft: drawerWidth,
    padding: theme.spacing(2),
    paddingTop: 0
  },
  themeIcon: {
    color: "inherit"
  },
  drawer: {
    "& .MuiDrawer-paper": {
     background: theme.palette.primary.dark,
     color: theme.palette.getContrastText(theme.palette.primary.dark),
     width: drawerWidth,
     "& .MuiListItemIcon-root, .MuiIconButton-root": {
      color: "inherit"
     },
     "& .MuiDivider-root": {
       backgroundColor: "rgba(255, 255, 255, 0.12)"
     }
   }
  },
  title: {
    width: "100%",
    textAlign: "center"
  }
}));

const MainLayout = (props: React.PropsWithChildren<MainLayoutProps>) => {
  const classes = useStyles();

  return (
    <Fragment>
      <Drawer
        variant="permanent"
        anchor="left"
        className={classes.drawer}
      >
        <List>
          <ListItem>
            <Typography className={classes.title} variant="h5">JobHunt</Typography>
          </ListItem>
          <Divider />
          <ListItem button component={ Link } to="/">
            <ListItemIcon><Dashboard/></ListItemIcon>
            <ListItemText primary="Dashboard"/>
          </ListItem>
          <ListItem button component={ Link } to="/jobs">
            <ListItemIcon><Work/></ListItemIcon>
            <ListItemText primary="Jobs"/>
          </ListItem>
          <ListItem button component={Link} to="/companies">
            <ListItemIcon><Business/></ListItemIcon>
            <ListItemText primary="Companies"/>
          </ListItem>
          <ListItem button component={Link} to="/searches">
            <ListItemIcon><Search/></ListItemIcon>
            <ListItemText primary="Searches"/>
          </ListItem>
          <Divider/>
          <ListItem>
            <Grid container justify="center">
              <Grid item>
                <Tooltip title="Toggle theme">
                  <IconButton
                    aria-label="Toggle theme"
                    onClick={() => { props.setDarkMode(!props.darkMode); localStorage.setItem("theme", props.darkMode ? "light" : "dark") }}
                  >
                    {props.darkMode ? <BrightnessHigh /> : <Brightness2 />}
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Alerts/>
              </Grid>
            </Grid>
          </ListItem>
        </List>
      </Drawer>
      <main className={classes.mainContainer}>
        <Toolbar>
          <Typography variant="h4">{props.pageTitle ? props.pageTitle : null}</Typography>
        </Toolbar>
        {props.children}
      </main>
    </Fragment>
  )
}

export default MainLayout;