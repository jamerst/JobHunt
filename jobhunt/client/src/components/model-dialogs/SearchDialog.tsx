import React, { Fragment, useCallback, useMemo, useState } from "react";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, MenuItem } from "@mui/material";
import { Add } from "@mui/icons-material";

import { Checkboxes, Select, Switches, TextField } from "mui-rff";
import { Form } from "react-final-form";

import makeStyles from "makeStyles";

import HideOnScroll from "components/HideOnScroll";
import Grid from "components/Grid";
import NumberField from "components/forms/NumberField";
import CountrySelector from "components/forms/CountrySelector";

import { getChangedProperties, hasDefined } from "utils/forms";
import { IndeedSupportedCountries } from "utils/constants";
import { useFeedback } from "utils/hooks";
import { Search } from "types/models/Search";

type SearchDialogProps = {
  mode: "edit" | "create",
  search?: Search,
  open: boolean,
  onSave: () => void,
  onCancel: () => void
}

type FormSearch = Omit<Search, "employerOnly"> & {
  recruiter: boolean
}

const useStyles = makeStyles()(theme => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

const enabledData = { label: "Enabled", value: "enabled" };
const recruiterData = { label: "Include jobs from recruiters", value: "recruiter" };

const SearchDialog = ({ mode, search, open, onSave, onCancel }: SearchDialogProps) => {
  const [createOpen, setCreateOpen] = useState(false);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const { classes } = useStyles();

  const formSearch: FormSearch | undefined = useMemo(() => search
    ? { ...search, recruiter: !search.employerOnly, jobType: search.jobType ? search.jobType : "any" }
    : { id: 0, enabled: true, query: "", country: "", recruiter: true, runs: [], displayName: "", provider: "Indeed", jobType: "any", distance: 20 },
    [search]
  );

  const onFabClick = useCallback(() => setCreateOpen(true), []);
  const onClose = useCallback(() => {
    setCreateOpen(false);
    onCancel();
  }, [onCancel]);

  const onSubmit = useCallback(async (values: FormSearch) => {
    showLoading();

    const requestData: Search = { ...values, employerOnly: !values.recruiter, jobType: values.jobType !== "any" ? values.jobType : "" };

    if (mode === "create") {
      beforeSubmit(requestData);

      const response = await fetch("/api/odata/search", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        showSuccess();
        onSave();
      } else {
        showError();
        console.error(`API request failed: POST /api/odata/search, HTTP ${response.status}`);
      }
    } else if (mode === "edit" && search) {
      const changed = getChangedProperties(search, requestData);

      if (hasDefined(changed)) {
        beforeSubmit(changed);

        const response = await fetch(`/api/odata/search(${search.id})`, {
          method: "PATCH",
          body: JSON.stringify(changed),
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          showSuccess();
          onSave();
        } else {
          showError();
          console.error(`API request failed: PATCH /api/odata/search(${search.id}), HTTP ${response.status}`);
        }
      } else {
        onCancel();
        clear();
      }
    }
  }, [mode, search, onSave, onCancel, showLoading, showSuccess, showError, clear]);

  const actuallyOpen = useMemo(() => open || createOpen, [open, createOpen]);

  return (
    <Fragment>
      <HideOnScroll>
        <Fab className={classes.fab} color="secondary" aria-label="Add New Search" onClick={onFabClick}>
           <Add />
        </Fab>
      </HideOnScroll>
      <Dialog open={actuallyOpen} onClose={onClose} aria-labelledby="search-modal-title" fullWidth>
        <DialogTitle id="search-modal-title">{mode === "edit" ? "Edit Search" : "Add New Search"}</DialogTitle>
        <Form
          onSubmit={onSubmit}
          initialValues={formSearch}
          subscription={{ submitting: true }}
          render={({ handleSubmit, submitting }) => (
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Switches name="enabled" data={enabledData} />
                  </Grid>

                  <Grid item xs={12} mb={2}>
                    <TextField label="Search Term" name="query" fullWidth required />
                  </Grid>

                  <Grid item xs={12} mb={2}>
                    <Select name="provider" label="Provider" required>
                      <MenuItem value="Indeed">Indeed</MenuItem>
                    </Select>
                  </Grid>

                  <Grid item container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Location" name="location" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <NumberField label="Distance" name="distance" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <CountrySelector name="country" label="Country" allowedCountries={IndeedSupportedCountries} required hideForbiddenCountries/>
                    </Grid>
                  </Grid>

                  <Grid item container spacing={2} mb={2}>
                    <Grid item xs={12}>
                      <Checkboxes name="recruiter" data={recruiterData} />
                    </Grid>
                    <Grid item xs={12}>
                      <Select name="jobType" label="Job Type" required>
                        <MenuItem value="any">Any</MenuItem>
                        <MenuItem value="permanent">Permanent</MenuItem>
                        <MenuItem value="fulltime">Full-time</MenuItem>
                        <MenuItem value="contract">Contract</MenuItem>
                        <MenuItem value="apprenticeship">Apprenticeship</MenuItem>
                        <MenuItem value="temporary">Temporary</MenuItem>
                        <MenuItem value="parttime">Part-time</MenuItem>
                        <MenuItem value="internship">Internship</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12}>
                      <NumberField label="Maximum Age (days)" name="maxAge" fullWidth />
                    </Grid>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button type="reset" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={submitting}>Save</Button>
              </DialogActions>
            </form>
          )}
        />
      </Dialog>
    </Fragment>
  )
}

const beforeSubmit = (requestData: any) => {
  // workaround for weird issue where submitting extra JSON properties causes the request to be rejected
  delete requestData.recruiter;
  delete requestData.displayName;

  return requestData;
}

export default SearchDialog;