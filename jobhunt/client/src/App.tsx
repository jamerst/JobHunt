import React, { useMemo } from 'react';
import { Routes, BrowserRouter, Route } from "react-router-dom"
import { CssBaseline, gridClasses } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache"
import { blue, purple } from '@mui/material/colors';
import { useRecoilValue } from 'recoil';

import MainLayout from "layouts/MainLayout"
import Companies from 'views/Companies';
import Company from 'views/Company';
import Dashboard from "views/Dashboard"
import Job from 'views/Job';
import Jobs from 'views/Jobs';
import Search from 'views/Search';
import Searches from 'views/Searches';
import PageChanges from 'views/PageChanges';
import FeedbackBackdrop from 'components/FeedbackBackdrop';
import { themeState } from 'state';

export const muiCache = createCache({
  key: "mui",
  prepend: true
});

function App() {
  const themeMode = useRecoilValue(themeState);

  const theme = useMemo(() => {
    const theme = createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: blue[500],
          dark: blue[700]
        },
        secondary: {
          main: purple[500]
        },
        background: {
          default: themeMode === "dark" ? "#303030" : "#fafafa",
          paper: themeMode === "dark" ? "#424242" : "#fff"
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
  }, [themeMode]);

  return (
    <CacheProvider value={muiCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FeedbackBackdrop />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <MainLayout pageTitle="Dashboard">
                <Dashboard/>
              </MainLayout>
            } />
            <Route path="/jobs" element={
              <MainLayout pageTitle="Saved Jobs">
                <Jobs/>
              </MainLayout>
            } />

            <Route path="/job/:id" element={
              <MainLayout>
                <Job/>
              </MainLayout>
            } />

            <Route path="/companies" element={
              <MainLayout pageTitle="Saved Companies">
                <Companies/>
              </MainLayout>
            } />

            <Route path="/company/:id" element={
              <MainLayout>
                <Company/>
              </MainLayout>
            } />

            <Route path="/searches" element={
              <MainLayout>
                <Searches/>
              </MainLayout>
            } />

            <Route path="/search/:id" element={
              <MainLayout>
                <Search/>
              </MainLayout>
            } />

            <Route path="/page-changes/:id" element={
              <MainLayout pageTitle="Page Changes">
                <PageChanges/>
              </MainLayout>
            } />
          </Routes>
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