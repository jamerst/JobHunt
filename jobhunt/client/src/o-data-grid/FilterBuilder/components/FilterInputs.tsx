import React, { Fragment, useMemo } from "react"
import { useRecoilValue } from "recoil";
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/lab";
import DateAdapter from "@mui/lab/AdapterDayjs";
import enGB from "dayjs/locale/en-gb"

import Grid from "components/Grid";

import { Operation } from "../types";

import { columnsState } from "../../state"
import { SelectOption, ValueOption } from "o-data-grid/types";
import { getSelectOption } from "../utils";


const _defaultOps: Operation[] = ["eq", "ne", "gt", "lt", "ge", "le", "contains"];


type FilterInputsProps = {
  clauseId: string,
  field: string,
  onFieldChange: (oldField: string, currentOp: Operation, newField: string) => void,
  op: Operation,
  onOpChange: (op: Operation) => void,
  value?: string,
  onValueChange: (v: any) => void,
}

const FilterInputs = React.memo(({ clauseId, field, onFieldChange, op, onOpChange, value, onValueChange }: FilterInputsProps) => {
  const columns = useRecoilValue(columnsState);

  const currentCol = useMemo(() => {
    if (!field && columns.length < 1) {
      return null;
    }

    let col;
    if (field) {
      col = columns.find(c => c.field === field);
    } else {
      col = columns[0]
    }

    if (!col) {
      return null;
    }

    // get value options into a single type
    let valueOptions: SelectOption[] | undefined;
    if (col.type === "singleSelect" && typeof col.valueOptions === "function") {
      valueOptions = col.valueOptions({ field: field }).map((v) => getSelectOption(v));
    } else if (col.type === "singleSelect" && col.valueOptions) {
      valueOptions = (col.valueOptions as ValueOption[]).map((v) => getSelectOption(v));
    }

    return {
      option: { label: col.headerName ?? col.field, field: col.field },
      ops: col.filterOperators ?? _defaultOps,
      type: col.type,
      valueOptions: valueOptions,
      col: col
    };
  }, [field, columns]);

  if (columns.length < 1 || !currentCol) {
    return null;
  }

  return (
    <Fragment>
      <Grid item xs>
        <Autocomplete
          options={columns.filter(c => c.filterable !== false).map(c => ({ label: c.headerName ?? c.field, field: c.field }))}
          renderInput={(params) => <TextField {...params} label="Field" />}
          value={currentCol.option}
          onChange={(_, val) => onFieldChange(field, op, val.field)}
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
            label="Operation"
          >
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
        {
          currentCol.type === "date" &&
          <LocalizationProvider dateAdapter={DateAdapter} locale={enGB}>
              <DatePicker
                label="Value"
                {...currentCol.col.datePickerProps}
                value={value ?? ""}
                renderInput={(params) => <TextField {...params} fullWidth size="small" {...currentCol.col.textFieldProps} />}
                onChange={(date) => onValueChange(date as Date)}
              />
          </LocalizationProvider>
        }
        {
          currentCol.type === "datetime" &&
          <LocalizationProvider dateAdapter={DateAdapter} locale={enGB}>
            <DateTimePicker
              label="Value"
              {...currentCol.col.dateTimePickerProps}
              value={value ?? ""}
              renderInput={(params) => <TextField {...params} fullWidth size="small" {...currentCol.col.textFieldProps} />}
              onChange={(date) => onValueChange(date as Date)}
            />
          </LocalizationProvider>
        }
        {
          currentCol.type === "boolean" &&
          <FormControl fullWidth size="small">
            <InputLabel id={`${clauseId}_label-bool-value`}>Value</InputLabel>
            <Select
              value={op}
              onChange={(e) => onValueChange(e.target.value)}
              labelId={`${clauseId}_label-bool-value`}
              label="Value"
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
              {currentCol.col.nullable && <MenuItem value="null">Unknown</MenuItem>}
            </Select>
          </FormControl>
        }
        {
          currentCol.type === "singleSelect" && currentCol.col.valueOptions &&
          <FormControl fullWidth size="small">
            <InputLabel id={`${clauseId}_label-select-value`}>Value</InputLabel>
            <Select
              value={value ?? ""}
              onChange={(e) => onValueChange(e.target.value)}
              labelId={`${clauseId}_label-select-value`}
              label="Value"
            >
              {currentCol.valueOptions!.map((o, i) =>
                (<MenuItem value={o.value} key={`${clauseId}_${field}_select_${i}`}>{o.label}</MenuItem>)
              )}
            </Select>
          </FormControl>
        }
        {
          (!currentCol.type || currentCol.type === "string" || currentCol.type === "number") &&
          <TextField
            size="small"
            fullWidth
            label="Value"
            {...currentCol.col!.textFieldProps}
            value={value ?? ""}
            onChange={(e) => onValueChange(e.target.value)}
            type={currentCol.type === "number" ? "number" : "text"}
          />
        }
      </Grid>
    </Fragment>
  )
});

export default FilterInputs;
