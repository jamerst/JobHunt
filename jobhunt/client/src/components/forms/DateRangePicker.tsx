import React, { useCallback } from "react"
import { TextField, TextFieldProps, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import Grid from "components/Grid"
import { Dayjs } from "dayjs";

export type DateRange = {
  start: Dayjs | null,
  end: Dayjs | null
}

type DateRangePickerProps = {
  value: DateRange,
  onChange: (v: DateRange) => void
}

const renderInput = (props: TextFieldProps) => <TextField {...props} size="small" />;

export const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const onStartChange = useCallback((v: Dayjs | null) => {
    onChange({ ...value, start: v });
  }, [onChange, value]);

  const onEndChange = useCallback((v: Dayjs | null) => {
    onChange({ ...value, end: v });
  }, [onChange, value]);

  const isDateDisabledStart = useCallback((day: Dayjs | null) => {
    if (day) {
      if (value.end !== null) {
        return day.isAfter(value.end);
      }
    }

    return false;
  }, [value]);

  const isDateDisabledEnd = useCallback((day: Dayjs | null) => {
    if (day) {
      if (value.end !== null) {
        return day.isBefore(value.start);
      }
    }

    return false;
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={1} mb={2} alignItems="center">
        <Grid item>
          <DatePicker
            value={value.start}
            label="Start"
            renderInput={renderInput}
            onChange={onStartChange}
            shouldDisableDate={isDateDisabledStart}
          />
        </Grid>
        <Grid item><Typography>to</Typography></Grid>
        <Grid item>
        <DatePicker
            value={value.end}
            label="End"
            renderInput={renderInput}
            onChange={onEndChange}
            shouldDisableDate={isDateDisabledEnd}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}