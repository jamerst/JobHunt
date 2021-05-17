import React, { FunctionComponent, useEffect, useState, useCallback } from "react"
import { Box, Button, Chip, Container, Grid, Slider, TextField, Typography } from "@material-ui/core";
import { GridColDef } from "@material-ui/data-grid"
import { Helmet } from "react-helmet";


import Card from "../components/Card";
import CardBody from "../components/CardBody";
import CardHeader from "../components/CardHeader";
import ApiDataGrid from "../components/ApiDataGrid";
import { Link } from "react-router-dom";

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
          <Box mx={8} mb={4}>
            <Grid container spacing={2}>
              <Grid item md={12}>
                <TextField variant="filled" label="Search Term" fullWidth size="small" value={filter.term ?? ""} onChange={(e) => setFilter({...filter, term: e.target.value})}/>
              </Grid>
              <Grid item md={6}>
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
              <Grid item md={6}>
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
              <Grid item container md={12} spacing={1}>
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
              <Grid item md={12}>
                  <Button variant="contained" color="secondary" onClick={() => setQuery(toQuery(filter))}>Search</Button>
              </Grid>
            </Grid>
          </Box>
          <Box mx={4}>
            <Typography variant="h6">Search Results</Typography>
            <ApiDataGrid
              url="/api/companies/search"
              columns={columns}
              disableColumnMenu
              disableColumnSelector
              queryParams={query}
            />
          </Box>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Companies;