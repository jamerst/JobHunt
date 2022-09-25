import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Add, Edit } from "@mui/icons-material";

import { Autocomplete, DateTimePicker, TextField } from "mui-rff";
import { Form } from "react-final-form";

import dayjs, { Dayjs } from "dayjs";
import enGB from "dayjs/locale/en-gb"
import utc from "dayjs/plugin/utc"

import makeStyles from "makeStyles";

import HideOnScroll from "components/HideOnScroll";
import Grid from "components/Grid";
import NumberField from "components/forms/NumberField";

import { getChangedProperties, hasDefined } from "utils/forms";

import Job from "types/models/Job";
import Company from "types/models/Company";
import { ODataMultipleResult } from "types/odata/ODataMultipleResult";
import { useFeedback } from "utils/hooks";

type JobDialogProps = {
  mode: "edit" | "create",
  job?: Job,
  onUpdate?: () => any
}

type FormJob = Omit<Job, "posted"> & {
  posted: Dayjs
}

const useStyles = makeStyles()(theme => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  },
  descField: {
    "& textarea": {
      fontFamily: "monospace",
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight
    }
  }
}));

dayjs.extend(utc);

const getOptionValue = (c: Company) => c.id;
const getOptionLabel = (c: Company | string) => (c as Company)?.name ?? "";

const JobDialog = ({ mode, job, onUpdate }: JobDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const companiesFetched = useRef(false);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const { classes } = useStyles();
  const navigate = useNavigate();

  const onFabClick = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const formJob: FormJob | undefined = useMemo(
    () => job ?
      ({ ...job, posted: dayjs.utc(job.posted) })
      : undefined,
    [job]
  );

  const onSubmit = useCallback(async (values: FormJob) => {
    showLoading();

    const requestData: Job = { ...values, posted: values.posted.format("YYYY-MM-DDTHH:mm:ss") + "Z" };

    if (mode === "create") {
      const response = await fetch("/api/odata/job", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const responseData = await response.json() as Job;
        showSuccess();
        if (responseData) {
          navigate(`/job/${responseData.id}`);
        }
      } else {
        showError();
        console.error(`API request failed: POST /api/odata/job, HTTP ${response.status}`);
      }
    } else if (mode === "edit" && job) {
      const changed = getChangedProperties(job, requestData);

      if (hasDefined(changed)) {
        const response = await fetch(`/api/odata/job(${job.id})`, {
          method: "PATCH",
          body: JSON.stringify(changed),
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          showSuccess();
          if (onUpdate) {
            onUpdate();
          }
        } else {
          showError();
          console.error(`API request failed: PATCH /api/odata/job(${job.id}), HTTP ${response.status}`);
        }
      } else {
        clear();
      }
    }

    setOpen(false);
  }, [mode, job, onUpdate, navigate, showLoading, showSuccess, showError, clear]);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (companiesFetched.current) {
      return;
    }

    // can't use ApiAutocomplete because wrapping the mui-rff Autocomplete breaks it for some reason
    // if it is wrapped in another component it won't select the initial value
    const fetchCompanies = async () => {
      const response = await fetch("/api/odata/company?$select=Id,Name&$orderby=Name");
      if (response.ok) {
        const data = await response.json() as ODataMultipleResult<Company>;
        if (data) {
          setCompanies(data.value);
        }
      } else {
        console.error(`API request failed: GET /api/odata/company?$select=Id,Name&$orderby=Name, HTTP ${response.status}`);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <Fragment>
      <HideOnScroll>
        <Fab className={classes.fab} color="secondary" aria-label={mode === "edit" ? "Edit Job" : "Add New Job"} onClick={onFabClick}>
          {mode === "edit" ? <Edit/> : <Add/>}
        </Fab>
      </HideOnScroll>
      <Dialog open={open} onClose={onClose} aria-labelledby="job-modal-title" fullWidth maxWidth="md">
        <DialogTitle id="job-modal-title">{mode === "edit" ? "Edit Job" : "Add New Job"}</DialogTitle>
        <Form
          onSubmit={onSubmit}
          initialValues={formJob}
          subscription={{ submitting: true }}
          render={({ handleSubmit, submitting }) => (
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} mb={2}>
                    <TextField label="Title" name="title" fullWidth required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Location" name="location" fullWidth required />
                  </Grid>
                  {
                    mode === "edit" &&
                    <Grid item container xs={12} spacing={1}>
                      <Grid item xs={12} md={6}>
                          <NumberField label="Latitude" name="latitude" fullWidth size="small" allowDecimal allowNegative />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <NumberField label="Longitude" name="longitude" fullWidth size="small" allowDecimal allowNegative />
                      </Grid>
                    </Grid>
                  }
                  <Grid item xs={12} mt={2}>
                    <Autocomplete
                      label="Company"
                      name="companyId"
                      required
                      options={companies}
                      getOptionValue={getOptionValue}
                      getOptionLabel={getOptionLabel}
                      fullWidth
                      disableClearable
                    />
                  </Grid>
                  {
                    mode === "edit" &&
                    <Grid item xs={12}>
                      <Autocomplete
                        label="Actual Company (if posted by recruiter)"
                        name="actualCompanyId"
                        options={companies}
                        getOptionValue={getOptionValue}
                        getOptionLabel={getOptionLabel}
                        fullWidth
                        defaultValue={null}
                      />
                    </Grid>
                  }
                  <Grid item container xs={12} spacing={1} mt={2} mb={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Salary" name="salary" fullWidth />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <NumberField label="Yearly Salary" name="avgYearlySalary" fullWidth />
                    </Grid>
                  </Grid>
                  <Grid item xs={12} mb={2}>
                    <TextField label="Job Description" name="description" required fullWidth multiline rows={15} className={classes.descField} />
                  </Grid>
                  <Grid item xs={12} mb={2}>
                    <TextField label="URL" name="url" fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={enGB}>
                      <DateTimePicker label="Posted" name="posted" required disableFuture inputFormat="DD/MM/YYYY HH:mm" />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button type="reset" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={submitting}>Save</Button>
              </DialogActions>
            </form>
          )}
        />
      </Dialog>
    </Fragment>
  )
}

export default JobDialog;