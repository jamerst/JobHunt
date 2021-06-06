import React, { Fragment, useState } from "react"
import { Divider, Drawer, Grid, Hidden, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography } from "@material-ui/core"
import { BrightnessHigh, Brightness2, Work, Business, Search, Dashboard, Menu  } from "@material-ui/icons";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Link } from "react-router-dom";
import Alerts from "../components/Alerts";
import { useResponsive } from "../utils/hooks";

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
    padding: theme.spacing(1),
    paddingTop: 0,
    [theme.breakpoints.up("md")] : {
      marginLeft: drawerWidth,
      padding: theme.spacing(2),
    }
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
  },
  toolbar: {
    [theme.breakpoints.down("md")]: {
      padding: 0,
    }
  }
}));

const MainLayout = (props: React.PropsWithChildren<MainLayoutProps>) => {
  const classes = useStyles();
  const r = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Fragment>
      <Drawer
        variant={r({xs: "temporary", md: "permanent"})}
        anchor="left"
        className={classes.drawer}
        open={r({xs: drawerOpen, md: true})}
        onClose={() => setDrawerOpen(false)}
      >
        <List>
          <ListItem>
            <Typography className={classes.title} variant="h5">JobHunt</Typography>
          </ListItem>
          <Divider />
          <ListItem button component={ Link } to="/" onClick={() => setDrawerOpen(false)}>
            <ListItemIcon><Dashboard/></ListItemIcon>
            <ListItemText primary="Dashboard"/>
          </ListItem>
          <ListItem button component={ Link } to="/jobs" onClick={() => setDrawerOpen(false)}>
            <ListItemIcon><Work/></ListItemIcon>
            <ListItemText primary="Jobs"/>
          </ListItem>
          <ListItem button component={Link} to="/companies" onClick={() => setDrawerOpen(false)}>
            <ListItemIcon><Business/></ListItemIcon>
            <ListItemText primary="Companies"/>
          </ListItem>
          <ListItem button component={Link} to="/searches" onClick={() => setDrawerOpen(false)}>
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
        <Toolbar className={classes.toolbar}>
          <Hidden mdUp>
            <IconButton onClick={() => setDrawerOpen(true)}>
              <Menu/>
            </IconButton>
          </Hidden>
          <Typography variant="h4">
            {props.pageTitle ? props.pageTitle : null}</Typography>
        </Toolbar>
        {props.children}
      </main>
    </Fragment>
  )
}

export default MainLayout;