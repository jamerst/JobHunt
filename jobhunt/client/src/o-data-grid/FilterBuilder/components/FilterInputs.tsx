import React, { useMemo } from "react"
import { useRecoilValue } from "recoil";
import { Autocomplete, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Remove } from "@mui/icons-material";

import Grid from "components/Grid";

import { Operation } from "../types";

import { columnsState } from "../../state"


const _defaultOps: Operation[] = ["eq", "ne", "gt", "lt", "ge", "le", "contains"];


type FilterInputsProps = {
  field: string,
  onFieldChange: (f: string) => void,
  op: Operation,
  onOpChange: (o: Operation) => void,
  value?: string,
  onValueChange: (v?: string) => void,
  onRemove: () => void
}

const FilterInputs = React.memo(({ field, onFieldChange, op, onOpChange, value, onValueChange, onRemove }: FilterInputsProps) => {
  const columns = useRecoilValue(columnsState);

  const currentCol = useMemo(() => {
    if (!field) {
      return { option: undefined, ops: _defaultOps };
    }

    const col = columns.find(c => c.field === field);
    if (!col) {
      return { option: undefined, ops: _defaultOps };
    }

    return {
      option: { label: col.headerName ?? col.field, field: col.field },
      ops: col.filterOperators ?? _defaultOps,
      type: col.type
    };
  }, [field, columns]);

  if (columns.length < 1 || !currentCol) {
    return null;
  }

  return (
    <Grid container spacing={1}>
      <Grid item xs>
        <Autocomplete
          options={columns.filter(c => c.filterable !== false).map(c => ({ label: c.headerName ?? c.field, field: c.field }))}
          renderInput={(params) => <TextField {...params} label="Field" />}
          value={currentCol?.option ?? { label: columns[0].headerName ?? columns[0].field, field: columns[0].field }}
          onChange={(_, val) => onFieldChange(val.field)}
          size="small"
          disableClearable
          isOptionEqualToValue={(option, value) => option.field === value.field}
        />
      </Grid>
      <Grid item xs>
        <FormControl fullWidth size="small">
          <InputLabel id="label-op">Operation</InputLabel>
          <Select
            value={op}
            onChange={(e) => onOpChange(e.target.value as Operation)}
            labelId="label-op"
            label="Operation">
            <MenuItem value="eq" disabled={!currentCol.ops.includes("eq")}>=</MenuItem>
            <MenuItem value="ne" disabled={!currentCol.ops.includes("ne")}>≠</MenuItem>
            <MenuItem value="gt" disabled={!currentCol.ops.includes("gt")}>&gt;</MenuItem>
            <MenuItem value="lt" disabled={!currentCol.ops.includes("lt")}>&lt;</MenuItem>
            <MenuItem value="ge" disabled={!currentCol.ops.includes("ge")}>&ge;</MenuItem>
            <MenuItem value="le" disabled={!currentCol.ops.includes("le")}>&le;</MenuItem>
            <MenuItem value="contains" disabled={!currentCol.ops.includes("contains")}>Contains</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs>
        <TextField
          value={value ?? ""}
          onChange={(e) => onValueChange(e.target.value)}
          size="small"
          fullWidth
          label="Value"
          type={currentCol.type === "number" ? "number" : "text"}
        />
      </Grid>
      <Grid item xs="auto">
        <IconButton onClick={() => onRemove()}>
          <Remove/>
        </IconButton>
      </Grid>
    </Grid>
  )
}, (n, p) => n.field === p.field && n.op === p.op && n.value === p.value);

export default FilterInputs;
