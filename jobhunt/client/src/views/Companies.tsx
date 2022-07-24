import React, { useState, useCallback } from "react"
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import Grid from "components/Grid";
import { GridSortModel } from "@mui/x-data-grid"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Add } from "@mui/icons-material";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router";
import { ODataColumnVisibilityModel } from "o-data-grid";
import ODataGrid from "components/odata/ODataGrid";

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"
import enGB from "dayjs/locale/en-gb"

import makeStyles from "makeStyles";
import HideOnScroll from "components/HideOnScroll";
import { getCompanyColumns } from "odata/CompanyColumns";

type Company = {
  name: string,
  location: string,
  website?: string,
  glassdoor?: string,
  linkedin?: string,
  endole?: string
}

const useStyles = makeStyles()((theme) => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

dayjs.extend(relativeTime);
dayjs.extend(utc);

const columnVisibility: ODataColumnVisibilityModel = {
  "avgSalary": { xs: false, xl: true },
  "jobs@odata.count": { xs: false, md: true },
  "latestJob": { xs: false, md: true },
  "latestPageUpdate": { xs: false, xl: true },
  "companyCategories": { xs: false, xxl: true },
}

const columns = getCompanyColumns();

const defaultSort: GridSortModel = [{ field: "name", sort: "asc" }];

const alwaysSelect = ["id"];

const Companies = () => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newCompany, setNewCompany] = useState<Company>({ name: "", location: "" });

  const { classes } = useStyles();
  const navigate = useNavigate();

  const create = useCallback(async () => {
    const response = await fetch("/api/companies/create", {
      method: "POST",
      body: JSON.stringify(newCompany),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      navigate(`/company/${data}`);
    } else {
      console.error(`API request failed: POST /api/companies/create, HTTP ${response.status}`);
    }
  }, [newCompany, navigate])

  return (
    <div>
      <Helmet>
        <title>Companies | JobHunt</title>
      </Helmet>

      <ODataGrid
        url="/api/odata/Company"
        columns={columns}
        columnVisibilityModel={columnVisibility}
        alwaysSelect={alwaysSelect}
        defaultSortModel={defaultSort}
        filterBuilderProps={{ localizationProviderProps: { dateAdapter: AdapterDayjs, locale: enGB } }}
        defaultPageSize={15}
      />

      <HideOnScroll>
        <Fab color="secondary" className={classes.fab} aria-label="add" onClick={() => setDialogOpen(!dialogOpen)}>
          <Add/>
        </Fab>
      </HideOnScroll>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Company</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(); }}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Name" value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} variant="outlined" fullWidth required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Location" value={newCompany.location} onChange={(e) => setNewCompany({...newCompany, location: e.target.value})} variant="outlined" fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Website" value={newCompany.website ?? ""} onChange={(e) => setNewCompany({...newCompany, website: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Glassdoor" value={newCompany.glassdoor ?? ""} onChange={(e) => setNewCompany({...newCompany, glassdoor: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
              <Grid item xs={12}>
                <TextField label="LinkedIn" value={newCompany.linkedin ?? ""} onChange={(e) => setNewCompany({...newCompany, linkedin: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Endole" value={newCompany.endole ?? ""} onChange={(e) => setNewCompany({...newCompany, endole: e.target.value})} variant="outlined" fullWidth size="small"/>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={() => setDialogOpen(false)} type="reset">
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default Companies;