import React, { useState, useMemo } from 'react';
import { Switch, BrowserRouter, Route } from "react-router-dom"
import { CssBaseline, gridClasses } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache"
import { blue, purple } from '@mui/material/colors';

import MainLayout from "layouts/MainLayout"
import Companies from 'views/Companies';
import Company from 'views/Company';
import Dashboard from "views/Dashboard"
import Job from 'views/Job';
import Jobs from 'views/Jobs';
import Search from 'views/Search';
import Searches from 'views/Searches';
import ODataTest from 'views/ODataTest';

export const muiCache = createCache({
  key: "mui",
  prepend: true
});

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("theme") === "dark"
    || (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("theme") === null)
  );

  const theme = useMemo(() => {
    const theme = createTheme({
      palette: {
        mode: darkMode ? "dark" : "light",
        primary: {
          main: blue[500],
          dark: blue[700]
        },
        secondary: {
          main: purple[500]
        },
        background: {
          default: darkMode ? "#303030" : "#fafafa",
          paper: darkMode ? "#424242" : "#fff"
        }
      },
      components: {
        MuiLink: {
          styleOverrides: {
            root: {
              color: "inherit",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline"
              }
            }
          }
        },
        MuiGrid: {
          styleOverrides: {
            root: {
              [`& .${gridClasses.item}:empty`]: {
                padding: "0 !important"
              }
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none"
            }
          }
        }
      },
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 960,
          lg: 1280,
          xl: 1920,
          xxl: 2500
        }
      }
    });

    if (theme?.components) {
      theme.components.MuiContainer = {
        styleOverrides: {
          root: {
            [theme.breakpoints.down("sm")]: {
              padding: 0
            }
          }
        }
      }
    }

    return theme;
  }, [darkMode]);

  return (
    <CacheProvider value={muiCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <MainLayout pageTitle="Dashboard" darkMode={darkMode} setDarkMode={setDarkMode}>
                <Dashboard/>
              </MainLayout>
            </Route>
            <Route exact path="/jobs">
              <MainLayout pageTitle="Saved Jobs" darkMode={darkMode} setDarkMode={setDarkMode}>
                <Jobs/>
              </MainLayout>
            </Route>
            <Route exact path="/job/:id">
              <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
                <Job/>
              </MainLayout>
            </Route>
            <Route exact path="/companies">
              <MainLayout pageTitle="Saved Companies" darkMode={darkMode} setDarkMode={setDarkMode}>
                <Companies/>
              </MainLayout>
            </Route>
            <Route exact path="/company/:id">
              <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
                <Company/>
              </MainLayout>
            </Route>
            <Route exact path="/searches">
              <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
                <Searches/>
              </MainLayout>
            </Route>
            <Route exact path="/search/:id">
              <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
                <Search/>
              </MainLayout>
            </Route>
            <Route exact path="/odata-test">
              <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
                <ODataTest/>
              </MainLayout>
            </Route>
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }
}