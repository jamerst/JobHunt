import React, { Fragment, useCallback, useMemo, useState } from "react";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Add, Edit } from "@mui/icons-material";

import { DatePicker, TextField } from "mui-rff";
import { Form } from "react-final-form";

import enGB from "dayjs/locale/en-gb"
import utc from "dayjs/plugin/utc"

import HideOnScroll from "components/HideOnScroll";
import Grid from "components/Grid";

import { Job } from "types/models/Job";
import makeStyles from "makeStyles";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router";

type JobDialogProps = {
  mode: "edit" | "create",
  job?: Job,
}

type FormJob = Omit<Job, "Posted"> & {
  Posted: Dayjs
}

const useStyles = makeStyles()(theme => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

dayjs.extend(utc);

const JobDialog = ({ mode, job }: JobDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);

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
    const requestData: Job = { ...values, Posted: values.Posted.format("YYYY-MM-DDTHH:mm:ss") };

    if (mode === "create") {
      const response = await fetch("/api/odata/job", {
        method: "POST",
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const responseData = await response.json() as Job;
        if (responseData) {
          navigate(`/job/${responseData.Id}`);
        }
      } else {
        console.error(`API request failed: POST /api/odata/job, HTTP ${response.status}`);
      }
    }

    setOpen(false);
  }, [navigate]);

  const onCancel = useCallback(() => {
    setOpen(false);
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
            render={({ handleSubmit, values }) => (
              <form onSubmit={handleSubmit}>
                <DialogContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Title" name="Title" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Location" name="Location" fullWidth required />
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
                        <DatePicker label="Posted" name="Posted" required disableFuture />
                      </LocalizationProvider>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button type="reset" onClick={onCancel}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </DialogActions>
              </form>
            )}
          />
      </Dialog>
    </Fragment>
  )
}

export default JobDialog;