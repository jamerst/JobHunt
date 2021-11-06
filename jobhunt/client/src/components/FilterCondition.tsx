import React, { useMemo } from "react"
import { ODataFilterCondition, ODataOperation } from "./FilterBuilder"
import { ODataGridColDef } from "./ODataGrid"
import Grid from "components/Grid";
import { Autocomplete, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Remove } from "@mui/icons-material";

type FilterConditionProps = {
  columns: ODataGridColDef[],
  condition: ODataFilterCondition,
  onChange: (c: ODataFilterCondition) => void,
  onRemove: () => void
}

const _defaultOps: ODataOperation[] = ["eq", "ne", "gt", "lt", "ge", "le", "contains"];

const FilterCondition = React.memo((props: FilterConditionProps) => {
  const currentCol = useMemo(() => {
    if (!props.condition.field) {
      return { option: undefined, ops: _defaultOps };
    }

    const col = props.columns.find(c => c.field === props.condition.field);
    if (!col) {
      return { option: undefined, ops: _defaultOps };
    }

    return {
      option: { label: col.headerName ?? col.field, field: col.field },
      ops: col.filterOperators ?? _defaultOps,
      type: col.type
    };
  }, [props.condition, props.columns]);

  return (
    <Grid container spacing={1}>
      <Grid item xs>
        <Autocomplete
          options={props.columns.filter(c => c.filterable !== false).map(c => ({ label: c.headerName ?? c.field, field: c.field }))}
          renderInput={(params) => <TextField {...params} label="Field" />}
          value={currentCol?.option ?? { label: props.columns[0].headerName ?? props.columns[0].field, field: props.columns[0].field }}
          onChange={(_, val) => props.onChange({...props.condition, field: val.field})}
          size="small"
          disableClearable
          isOptionEqualToValue={(option, value) => option.field === value.field}
        />
      </Grid>
      <Grid item xs>
        <FormControl fullWidth size="small">
          <InputLabel id="label-op">Operation</InputLabel>
          <Select
            value={props.condition.op}
            onChange={(e) => props.onChange({...props.condition, op: e.target.value as ODataOperation})}
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
          value={props.condition.value ?? ""}
          onChange={(e) => props.onChange({...props.condition, value: e.target.value})}
          size="small"
          fullWidth
          label="Value"
          type={currentCol.type === "number" ? "number" : "text"}
        />
      </Grid>
      <Grid item xs="auto">
        <IconButton onClick={() => props.onRemove()}>
          <Remove/>
        </IconButton>
      </Grid>
    </Grid>
  );
}, (n, p) => n.columns === p.columns
  && n.onChange === p.onChange
  && n.condition.field === p.condition.field
  && n.condition.op === p.condition.op
  && n.condition.value === p.condition.value
  && n.condition.collectionField === p.condition.collectionField
  && n.condition.collectionOp === p.condition.collectionOp
  && n.condition.complement === p.condition.complement
);

export default FilterCondition;