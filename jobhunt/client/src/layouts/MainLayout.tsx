import React, { Fragment, PropsWithChildren, useState, useMemo, useCallback } from "react"
import { Badge, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography } from "@mui/material"
import Grid from "components/Grid";
import { BrightnessHigh, Brightness2, Work, Business, Search, Dashboard, Menu  } from "@mui/icons-material";

import makeStyles from "makeStyles";

import { Link } from "react-router-dom";
import Alerts from "components/Alerts";
import { useResponsive } from "utils/hooks";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { themeState } from "state";

type MainLayoutProps = {
  pageTitle?: string
}

const drawerWidth = 240;

const useStyles = makeStyles()((theme) => ({
  root: {
    width: "100vw"
  },
  mainContainer: {
    padding: theme.spacing(1),
    paddingTop: 0,
    [theme.breakpoints.up("md")] : {
      marginLeft: drawerWidth,
      padding: theme.spacing(2),
    },
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
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
    [theme.breakpoints.down('lg')]: {
      padding: 0,
    }
  }
}));

const MainLayout = (props: PropsWithChildren<MainLayoutProps>) => {
  const { classes } = useStyles();
  const r = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const [theme, setTheme] = useRecoilState(themeState);

  const changeTheme = useCallback(() => {
    setTheme((t) => {
      let newTheme: "light" | "dark";
      if (t === "light") {
        newTheme = "dark";
      } else {
        newTheme = "light";
      }

      localStorage.setItem("theme", newTheme);

      return newTheme;
    });
  }, [setTheme]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const response = await fetch("/api/alerts/unreadcount");
      if (response.ok) {
        setAlertCount(await response.json() as number);
      } else {
        console.error(`API request failed: GET /api/alerts/unreadcount, HTTP ${response.status}`);
      }
    }

    fetchUnreadCount();
  }, []);

  const open = useMemo(() => r({ xs: drawerOpen, md: true }), [r, drawerOpen]);
  const variant: "temporary" | "permanent" | undefined = useMemo(() => r({ xs: "temporary", md: "permanent" }), [r]);

  return (
    <Fragment>
      <Drawer
        variant={variant}
        anchor="left"
        className={classes.drawer}
        open={open}
        onClose={closeDrawer}
        keepMounted
      >
        <List>
          <ListItem>
            <Typography className={classes.title} variant="h5">JobHunt</Typography>
          </ListItem>
          <Divider />
          <ListItemButton component={ Link } to="/" onClick={closeDrawer}>
            <ListItemIcon><Dashboard/></ListItemIcon>
            <ListItemText primary="Dashboard"/>
          </ListItemButton>
          <ListItemButton component={ Link } to="/jobs" onClick={closeDrawer}>
            <ListItemIcon><Work/></ListItemIcon>
            <ListItemText primary="Jobs"/>
          </ListItemButton>
          <ListItemButton component={Link} to="/companies" onClick={closeDrawer}>
            <ListItemIcon><Business/></ListItemIcon>
            <ListItemText primary="Companies"/>
          </ListItemButton>
          <ListItemButton component={Link} to="/searches" onClick={closeDrawer}>
            <ListItemIcon><Search/></ListItemIcon>
            <ListItemText primary="Searches"/>
          </ListItemButton>
          <Divider/>
          <ListItem>
            <Grid container justifyContent="center">
              <Grid item>
                <Tooltip title="Toggle theme">
                  <IconButton
                    aria-label="Toggle theme"
                    onClick={changeTheme}
                    size="large">
                    {theme === "dark" ? <BrightnessHigh /> : <Brightness2 />}
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Alerts onAlertClick={closeDrawer} setAlertCount={setAlertCount} />
              </Grid>
            </Grid>
          </ListItem>
        </List>
      </Drawer>
      <main className={classes.mainContainer}>
        <Toolbar className={classes.toolbar}>
          <IconButton onClick={openDrawer} size="large" sx={{ display: { md: "none", xs: "block" }}}>
            <Badge badgeContent={alertCount} color="secondary">
              <Menu/>
            </Badge>
          </IconButton>

          <Typography variant="h4">
            {props.pageTitle ? props.pageTitle : null}</Typography>
        </Toolbar>
        {props.children}
      </main>
    </Fragment>
  );
}

export default MainLayout;