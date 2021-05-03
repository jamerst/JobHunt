import React, { Fragment, useState, useMemo } from 'react';
import { Switch, BrowserRouter, Route } from "react-router-dom"
import { CssBaseline } from "@material-ui/core"
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles"

import Dashboard from "./views/Dashboard"
import MainLayout from "./layouts/MainLayout"
import Job from './views/Job';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("theme") === "dark"
    || (window.matchMedia("(prefers-color-scheme: dark)").matches && localStorage.getItem("theme") === null)
  );

  const theme = React.useMemo(() =>
    createMuiTheme({
      palette: {
        type: darkMode ? "dark" : "light"
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
          <Route exact path="/job/:id">
            <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Job/>
            </MainLayout>
          </Route>
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
