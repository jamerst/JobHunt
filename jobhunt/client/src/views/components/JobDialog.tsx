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

import { Job } from "types/models/Job";

type JobDialogProps = {
  mode: "edit" | "create",
  job?: Job,
  onUpdate?: () => any
}

type FormJob = Omit<Job, "Posted"> & {
  Posted: Dayjs
}

type ODataMultipleResult<T> = {
  value: T[]
}

type CompanyResult = {
  Id: number,
  Name: string
}

const useStyles = makeStyles()(theme => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

dayjs.extend(utc);

const JobDialog = ({ mode, job, onUpdate }: JobDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const companiesFetched = useRef(false);

  const { classes } = useStyles();
  const navigate = useNavigate();

  const onFabClick = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const formJob: FormJob | undefined = useMemo(
    () => job ?
      ({ ...job, Posted: dayjs.utc(job.Posted) })
      : undefined,
    [job]
  );

  const onSubmit = useCallback(async (values: FormJob) => {
    console.debug(values);
    const requestData: Job = { ...values, Posted: values.Posted.format("YYYY-MM-DDTHH:mm:ss") + "Z" };

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
        if (responseData) {
          navigate(`/job/${responseData.Id}`);
        }
      } else {
        console.error(`API request failed: POST /api/odata/job, HTTP ${response.status}`);
      }
    } else if (mode === "edit" && job) {
      // compute the fields which have changed
      // we will submit using PATCH, which will only update the fields we provide
      const changed = Object.entries(requestData).reduce(
        (a: Partial<Job>, b) => {
          const key = b[0] as keyof Job;
          const value = b[1];

          if (key && value && job[key] !== value) {
            return { ...a, [key]: value }
          } else {
            return a;
          }
        },
        {}
      );

      const response = await fetch(`/api/odata/job(${job.Id})`, {
        method: "PATCH",
        body: JSON.stringify(changed),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        if (onUpdate) {
          onUpdate();
        }
      } else {
        console.error(`API request failed: PATCH /api/odata/job(${job.Id}), HTTP ${response.status}`);
      }
    }

    setOpen(false);
  }, [mode, job, onUpdate, navigate]);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (companiesFetched.current) {
      return;
    }

    const fetchCompanies = async () => {
      const response = await fetch("/api/odata/company?$select=Id,Name&$orderby=Name");
      if (response.ok) {
        const data = await response.json() as ODataMultipleResult<CompanyResult>;
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
      <Dialog open={open} onClose={onClose} aria-labelledby="job-modal-title" fullWidth>
        <DialogTitle id="job-modal-title">{mode === "edit" ? "Edit Job" : "Add New Job"}</DialogTitle>
          <Form
            onSubmit={onSubmit}
            initialValues={formJob}
            subscription={{ submitting: true }}
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit}>
                <DialogContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Title" name="Title" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Location" name="Location" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        label="Company"
                        name="CompanyId"
                        required
                        options={companies}
                        getOptionValue={o => o.Id}
                        getOptionLabel={o => (o as CompanyResult)?.Name ?? o}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Salary" name="Salary" fullWidth />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Yearly Salary" name="AvgYearlySalary" fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Job Description" name="Description" fullWidth multiline rows={10} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="URL" name="Url" fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={enGB}>
                        <DateTimePicker label="Posted" name="Posted" required disableFuture inputFormat="DD/MM/YYYY HH:mm" />
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