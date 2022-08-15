import React, { Fragment, useCallback, useMemo, useState } from "react";

import { AutocompleteRenderInputParams, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { nanoid } from "nanoid";

import ApiAutocomplete from "components/forms/ApiAutocomplete";
import Grid from "components/Grid";

type ODataCategoryFilterProps = {
  value: any,
  setValue: (v: any) => void,
  fetchUrl: string
}

type CategoryFilter = {
  categories: Category[],
  connective: "any" | "all"
}

type Category = {
  id: number,
  name: string
}

export const getCategoryFilterString = (value: any, categoryCollection: string) => {
  const filter = value as CategoryFilter;
  if (filter && filter.categories.length > 0) {
    if (filter.connective === "any") {
      return `${categoryCollection}/any(x:x/CategoryId in (${filter.categories.map(c => c.id).join(", ")}))`;
    } else if (filter.connective === "all") {
      return `(${filter.categories.map(c => `${categoryCollection}/any(x:x/CategoryId eq ${c.id})`).join(" and ")})`;
    }
  }
  return false;
}

const getCategoryResponseOptions = (r: any) => r as Category[] ?? [];
const renderInput = (params: AutocompleteRenderInputParams) => <TextField {...params} label="Category" />
const getOptionLabel = (o: any) => (o as Category)?.name ?? "";
const isOptionEqualToValue = (o: any, v: any) => o.id === v.id;

const ODataCategoryFilter = ({ value, setValue, fetchUrl }: ODataCategoryFilterProps) => {
  const [labelId] = useState(`category-filter-label_${nanoid(10)}`)

  const val = useMemo(() => value as CategoryFilter ?? { connective: "any", categories: [] }, [value]);

  const onConnectiveChange = useCallback((e: SelectChangeEvent<"any" | "all">) => {
    if (e.target.value === "any" || e.target.value === "all") {
      const newVal = { ...val };
      newVal.connective = e.target.value;
      setValue(newVal);
    }
  }, [val, setValue]);

  const onCategoryChange = useCallback((_: React.SyntheticEvent, v: any) => {
    const newVal = { ...val };
    newVal.categories = v as Category[];
    setValue(newVal);
  }, [val, setValue]);

  return (
    <Fragment>
      <Grid item xs={12} md>
        <FormControl fullWidth size="small">
          <InputLabel id={labelId}>Operation</InputLabel>
          <Select
            label="Operation"
            value={val.connective}
            onChange={onConnectiveChange}
            labelId={labelId}
          >
            <MenuItem value="any">Is one of</MenuItem>
            <MenuItem value="all">Has all of</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item container alignSelf="center" xs={12} md>
        <ApiAutocomplete
          fetchUrl={fetchUrl}
          getResponseOptions={getCategoryResponseOptions}
          renderInput={renderInput}
          getOptionLabel={getOptionLabel}
          isOptionEqualToValue={isOptionEqualToValue}
          value={val.categories as any}
          onChange={onCategoryChange}
          fullWidth
          multiple
          size="small"
        />
      </Grid>
  </Fragment>
  )
}

export default ODataCategoryFilter;