import React, { useState, useMemo } from 'react';
import { Switch, BrowserRouter, Route } from "react-router-dom"
import { CssBaseline } from "@material-ui/core"
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles"

import { useAudibleRenders } from "react-audible-debug"

import Dashboard from "./views/Dashboard"
import MainLayout from "./layouts/MainLayout"
import Job from './views/Job';
import Jobs from './views/Jobs';
import { blue, purple } from '@material-ui/core/colors';
import Company from './views/Company';
import Companies from './views/Companies';
import Searches from './views/Searches';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("theme") === "dark"
    || (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("theme") === null)
  );

  // useAudibleRenders(true);

  const theme = useMemo(() =>
    createMuiTheme({
      palette: {
        type: darkMode ? "dark" : "light",
        primary: {
          main: blue[500],
          dark: blue[700]
        },
        secondary: {
          main: purple[500]
        }
      },
      overrides: {
        MuiCssBaseline: {
          "@global": {
            ".MuiGrid-item:empty": {
              padding: "0 !important" // remove padding on empty grid items
            },
            "a": {
              color: "inherit",
              "&:hover": {
                textDecoration: "underline"
              }
            }
          }
        }
      }
    }),
    [darkMode],
  );

  return (
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
            <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Jobs/>
            </MainLayout>
          </Route>
          <Route exact path="/job/:id">
            <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Job/>
            </MainLayout>
          </Route>
          <Route exact path="/companies">
            <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
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
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
