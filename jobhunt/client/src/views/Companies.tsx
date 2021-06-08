import React, { FunctionComponent, useEffect, useState, useCallback } from "react"
import { Box, Button, Chip, Container, Slider, TextField, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@material-ui/core";
import Grid from "components/Grid";
import { GridColDef } from "@material-ui/data-grid"
import { Helmet } from "react-helmet";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Add } from "@material-ui/icons";
import { Link, useHistory } from "react-router-dom";

import Card from "components/Card";
import CardBody from "components/CardBody";
import CardHeader from "components/CardHeader";
import ApiDataGrid from "components/ApiDataGrid";
import { useResponsive } from "utils/hooks";

type SearchFilter = {
  term?: string,
  location?: string,
  distance?: number,
  posted?: Date,
  categories: number[],
  status?: string
}

const toQuery = (f: SearchFilter) =>  {
  let result:[string, string | undefined][] = [
    ["term", f.term],
    ["location", f.location],
    ["distance", f.distance?.toString()],
    ["posted", f.posted?.toISOString()],
    ["status", f.status]
  ]

  f.categories.forEach(c => result.push(["categories", c.toString()]))
  return result;
};

type Category = {
  id: number,
  name: string
}

type Company = {
  name: string,
  location: string,
  website?: string,
  glassdoor?: string,
  linkedin?: string,
  endole?: string
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  dialog: {
    minWidth: "40em",
    maxWidth: "100%",
    [theme.breakpoints.down("sm")]: {
      minWidth: 0
    }
  }
}));

const columns: GridColDef[] = [
  { field: "id", hide: true },
  {
    field: "name",
    headerName: "Name",
    flex: 2,
    sortable: false,
    renderCell: (params) => {
      return (<Link to={`/company/${params.id}`}>{params.value}</Link>)
    }
  },
  {
    field: "location",
    headerName: "Location",
    flex: 1,
    sortable: false,
    valueGetter: (params) => params.row.distance ? `${params.value} (${(params.row.distance as number).toFixed(1)}mi away)` : params.value
  }
];

const Companies: FunctionComponent = (props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<SearchFilter>({ categories: [] });
  const [query, setQuery] = useState<[string, string | undefined][]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newCompany, setNewCompany] = useState<Company>({ name: "", location: "" });

  const classes = useStyles();
  const history = useHistory();
  const r = useResponsive();

  const create = useCallback(async () => {
    const response = await fetch("/api/companies/create", {
      method: "POST",
      body: JSON.stringify(newCompany),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      history.push(`/company/${data}`);
    } else {
      console.error(`API request failed: POST /api/companies/create, HTTP ${response.status}`);
    }
  }, [newCompany, history])

  useEffect(() => {
    (async () => {
      const response = await fetch("api/companies/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data as Category[]);
      } else {
        console.error(`API request failed: /api/companies/categories, HTTP ${response.status}`);
      }
    })();
  }, []);

  const addCategory = useCallback((id: number) => {
    if (!filter.categories.includes(id)) {
      setFilter({...filter, categories: [...filter.categories, id]});
    }
  }, [filter]);

  const removeCategory = useCallback((id: number) => {
    if (filter.categories.includes(id)) {
      const newCategories = [...filter.categories].filter(c => c !== id);
      setFilter({...filter, categories: newCategories});
    }
  }, [filter]);

  return (
    <Container>
      <Helmet>
        <title>Companies | JobHunt</title>
      </Helmet>
      <Card>
        <CardHeader>
         <Typography variant="h4">Saved Companies</Typography>
        </CardHeader>
        <CardBody>
          <Box mx={r({xs: 1, md: 8})} mb={4} mt={1}>
            <form onSubmit={(e) => { e.preventDefault(); setQuery(toQuery(filter)); }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField variant="filled" label="Search Term" fullWidth size="small" value={filter.term ?? ""} onChange={(e) => setFilter({...filter, term: e.target.value})}/>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  variant="filled"
                  label="Location"
                  fullWidth
                  size="small"
                  value={filter.location ?? ""}
                  onChange={(e) => {
                    let distance = filter.distance;
                    if (e.target.value && !filter.distance) {
                      distance = 15;
                    } else if (!e.target.value) {
                      distance = undefined;
                    }
                    setFilter({...filter, location: e.target.value, distance: distance});
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography id="label-distance" gutterBottom>Distance</Typography>
                <Slider
                  value={filter.distance ?? 15}
                  onChange={(_, val) => setFilter({...filter, distance: val as number})}
                  step={5}
                  marks
                  min={0}
                  max={50}
                  valueLabelFormat={(val) => `${val}mi`}
                  valueLabelDisplay="auto"
                  aria-labelledby="label-distance"
                  disabled={!filter.location}
                />
              </Grid>
              <Grid item container xs={12} spacing={1}>
                {categories.map(c => (
                  <Grid item key={`category-selector-${c.id}`}>
                    <Chip
                      label={c.name}
                      onClick={() => addCategory(c.id)}
                      onDelete={filter.categories.includes(c.id) ? () => removeCategory(c.id) : undefined}
                      color={filter.categories.includes(c.id) ? "primary" : "default"}
                    />
                  </Grid>
                ))}
              </Grid>
              <Grid item xs={12}>
                  <Button variant="contained" color="secondary" onClick={() => setQuery(toQuery(filter))} type="submit">Search</Button>
              </Grid>
            </Grid>
            </form>
          </Box>
          <Box mx={r({xs: 1, md: 4})}>
            <Typography variant="h6">Search Results</Typography>
            <ApiDataGrid
              url="/api/companies/search"
              columns={columns}
              disableColumnMenu
              disableColumnSelector
              queryParams={query}
            />
          </Box>
          <Box mt={2}>
            <Grid container justify="flex-end">
              <Fab color="secondary" aria-label="add" onClick={() => setDialogOpen(!dialogOpen)}>
                <Add/>
              </Fab>
            </Grid>
          </Box>
        </CardBody>
      </Card>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="add-dialog-title">
        <DialogTitle id="add-dialog-title">Add New Company</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); create(); }}>
          <DialogContent className={classes.dialog}>
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
    </Container>
  );
}

export default Companies;