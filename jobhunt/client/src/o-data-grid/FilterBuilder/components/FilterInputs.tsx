import React, { Fragment, useMemo } from "react"
import { useRecoilValue } from "recoil";
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/lab";
import DateAdapter from "@mui/lab/AdapterDayjs";
import enGB from "dayjs/locale/en-gb"

import Grid from "components/Grid";

import { CollectionFieldDef, CollectionOperation, FieldDef, Operation } from "../types";

import { schemaState } from "../state"
import { SelectOption, ValueOption } from "o-data-grid/types";
import { getSelectOption } from "../utils";
import { allOperators, numericOperators } from "../constants";


type FilterInputsProps = {
  clauseId: string,
  field: string,
  onFieldChange: (oldField: string, currentOp: Operation, newField: string) => void,
  op: Operation,
  onOpChange: (op: Operation) => void,
  value?: string,
  onValueChange: (v: any) => void,
  collectionOp?: CollectionOperation,
  onCollectionOpChange: (op: CollectionOperation) => void,
  collectionField?: string,
  onCollectionFieldChange: (field: string, oldField: string | undefined, currentOp: Operation, newField: string | undefined) => void,
}

const FilterInputs = React.memo(({
  clauseId,
  field,
  onFieldChange,
  op,
  onOpChange,
  value,
  onValueChange,
  collectionOp,
  onCollectionOpChange,
  collectionField,
  onCollectionFieldChange
}: FilterInputsProps) => {

  const schema = useRecoilValue(schemaState);

  const fieldDef = useMemo(() => {
    if (!field && schema.length < 1) {
      return null;
    }

    let f: FieldDef;
    if (field) {
      f = schema.find(c => c.field === field) ?? schema[0];
    } else {
      f = schema[0]
    }

    if (!f) {
      return null;
    }

    let filterField = field;
    let colField: CollectionFieldDef | undefined;
    let type = f.type;
    let options = f.valueOptions;
    let ops = f.filterOperators ?? allOperators;
    if (f.collection === true && f.collectionFields) {
      if (collectionField) {
        colField = f.collectionFields.find(c => c.field === collectionField) ?? f.collectionFields[0];
      } else {
        colField = f.collectionFields[0];
      }

      filterField = colField.field;
      type = colField.type;
      options = colField.valueOptions;

      if (collectionOp !== "count") {
        ops = colField.filterOperators ?? allOperators;
      } else {
        ops = numericOperators;
      }
    }

    // get value options into a single type
    let valueOptions: SelectOption[] | undefined;
    if (type === "singleSelect" && typeof options === "function") {
      valueOptions = options({ field: filterField }).map((v) => getSelectOption(v));
    } else if (type === "singleSelect" && options) {
      valueOptions = (options as ValueOption[]).map((v) => getSelectOption(v));
    }

    return {
      ...f,
      fieldLabel: f.headerName ?? f.field,
      type: type,
      ops: ops,
      valueOptions: valueOptions,
      colField: colField
    };
  }, [field, collectionField, collectionOp, schema]);

  if (schema.length < 1 || !fieldDef) {
    return null;
  }

  return (
    <Fragment>
      <Grid item xs>
        <Autocomplete
          options={schema.filter(c => c.filterable !== false).map(c => ({ label: c.headerName ?? c.field, field: c.field }))}
          renderInput={(params) => <TextField {...params} label="Field" />}
          value={{ label: fieldDef.fieldLabel, field: fieldDef.field }}
          onChange={(_, val) => onFieldChange(fieldDef.field, op, val.field)}
          size="small"
          disableClearable
          isOptionEqualToValue={(option, value) => option.field === value.field}
        />
      </Grid>
      {
        fieldDef.collection === true &&
        <Grid item xs>
          <FormControl fullWidth size="small">
            <InputLabel id={`${clauseId}_label-collection-op`}>Operation</InputLabel>
            <Select
              value={collectionOp}
              onChange={(e) => onCollectionOpChange(e.target.value as CollectionOperation)}
              labelId={`${clauseId}_label-collection-op`}
              label="Operation"
            >
              <MenuItem value="any">Has at least one</MenuItem>
              <MenuItem value="all">All have</MenuItem>
              <MenuItem value="count">Count</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      }
      {
        fieldDef.collection === true && collectionOp !== "count" &&
        <Grid item xs>
          <Autocomplete
            options={fieldDef.collectionFields?.map(c => ({ label: c.label, field: c.field })) ?? []}
            renderInput={(params) => <TextField {...params} label="Field" />}
            value={{ label: fieldDef.colField?.label, field: collectionField }}
            onChange={(_, val) => onCollectionFieldChange(field, collectionField, op, val.field)}
            size="small"
            disableClearable
            isOptionEqualToValue={(option, value) => option.field === value.field}
          />
        </Grid>
      }
      <Grid item xs>
        <FormControl fullWidth size="small">
          <InputLabel id={`${clauseId}_label-op`}>Operation</InputLabel>
          <Select
            value={op}
            onChange={(e) => onOpChange(e.target.value as Operation)}
            labelId={`${clauseId}_label-op`}
            label="Operation"
          >
            <MenuItem value="eq" disabled={!fieldDef.ops.includes("eq")}>=</MenuItem>
            <MenuItem value="ne" disabled={!fieldDef.ops.includes("ne")}>≠</MenuItem>
            <MenuItem value="gt" disabled={!fieldDef.ops.includes("gt")}>&gt;</MenuItem>
            <MenuItem value="lt" disabled={!fieldDef.ops.includes("lt")}>&lt;</MenuItem>
            <MenuItem value="ge" disabled={!fieldDef.ops.includes("ge")}>&ge;</MenuItem>
            <MenuItem value="le" disabled={!fieldDef.ops.includes("le")}>&le;</MenuItem>
            <MenuItem value="contains" disabled={!fieldDef.ops.includes("contains")}>Contains</MenuItem>
            <MenuItem value="null" disabled={!fieldDef.ops.includes("null")}>Is Blank</MenuItem>
            <MenuItem value="notnull" disabled={!fieldDef.ops.includes("notnull")}>Is Not Blank</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs>
        {
          fieldDef.type === "date" &&
          <LocalizationProvider dateAdapter={DateAdapter} locale={enGB}>
            <DatePicker
              label="Value"
              {...fieldDef.datePickerProps}
              value={value ?? ""}
              renderInput={(params) => <TextField {...params} fullWidth size="small" {...fieldDef.textFieldProps} />}
              onChange={(date) => onValueChange(date as Date)}
            />
          </LocalizationProvider>
        }
        {
          fieldDef.type === "datetime" &&
          <LocalizationProvider dateAdapter={DateAdapter} locale={enGB}>
            <DateTimePicker
              label="Value"
              {...fieldDef.dateTimePickerProps}
              value={value ?? ""}
              renderInput={(params) => <TextField {...params} fullWidth size="small" {...fieldDef.textFieldProps} />}
              onChange={(date) => onValueChange(date as Date)}
            />
          </LocalizationProvider>
        }
        {
          fieldDef.type === "boolean" &&
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
              {fieldDef.nullable && <MenuItem value="null">Unknown</MenuItem>}
            </Select>
          </FormControl>
        }
        {
          fieldDef.type === "singleSelect" && fieldDef.valueOptions &&
          <FormControl fullWidth size="small">
            <InputLabel id={`${clauseId}_label-select-value`}>Value</InputLabel>
            <Select
              value={value ?? ""}
              onChange={(e) => onValueChange(e.target.value)}
              labelId={`${clauseId}_label-select-value`}
              label="Value"
            >
              {fieldDef.valueOptions!.map((o, i) =>
                (<MenuItem value={o.value} key={`${clauseId}_${field}_select_${i}`}>{o.label}</MenuItem>)
              )}
            </Select>
          </FormControl>
        }
        {
          (!fieldDef.type || fieldDef.type === "string" || fieldDef.type === "number") &&
          <TextField
            size="small"
            fullWidth
            label="Value"
            {...fieldDef!.textFieldProps}
            value={value ?? ""}
            onChange={(e) => onValueChange(e.target.value)}
            type={fieldDef.type === "number" ? "number" : "text"}
          />
        }
      </Grid>
    </Fragment>
  )
});

export default FilterInputs;
