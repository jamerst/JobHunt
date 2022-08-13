import React, { Fragment, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, MenuItem } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

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
  onUpdate?: () => any
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

const SearchDialog = ({ mode, search, onUpdate }: SearchDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const { classes } = useStyles();
  const navigate = useNavigate();

  const formSearch: FormSearch | undefined = useMemo(() => search
    ? { ...search, recruiter: !search.employerOnly, jobType: search.jobType ? search.jobType : "any" }
    : { id: 0, enabled: true, query: "", country: "", recruiter: true, runs: [], displayName: "", provider: "Indeed", jobType: "any", distance: 20 },
    [search]
  );

  const onFabClick = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const onSubmit = useCallback(async (values: FormSearch) => {
    showLoading();

    const requestData: Search = { ...values, employerOnly: !values.recruiter, jobType: values.jobType !== "any" ? values.jobType : "" };

    // workaround for weird issue where submitting extra JSON properties causes the request to be rejected
    delete (requestData as any).recruiter;
    delete (requestData as any).displayName;

    if (mode === "create") {
      const response = await fetch("/api/odata/search", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const responseData = await response.json() as Search;
        showSuccess();
        if (responseData) {
          navigate(`/search/${responseData.id}`);
        }
      } else {
        showError();
        console.error(`API request failed: POST /api/odata/search, HTTP ${response.status}`);
      }
    } else if (mode === "edit" && search) {
      const changed = getChangedProperties(search, requestData);

      if (hasDefined(changed)) {
        const response = await fetch(`/api/odata/search(${search.id})`, {
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
          console.error(`API request failed: PATCH /api/odata/search(${search.id}), HTTP ${response.status}`);
        }
      } else {
        clear();
      }
    }

    setOpen(false);
  }, [mode, search, onUpdate, navigate, showLoading, showSuccess, showError, clear]);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Fragment>
      <HideOnScroll>
        <Fab className={classes.fab} color="secondary" aria-label={mode === "edit" ? "Edit Search" : "Add New Search"} onClick={onFabClick}>
          {mode === "edit" ? <Edit/> : <Add/>}
        </Fab>
      </HideOnScroll>
      <Dialog open={open} onClose={onClose} aria-labelledby="search-modal-title" fullWidth>
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

                  <Grid item container spacing={1}>
                    <Grid item xs={12}>
                      <TextField label="Location" name="location" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <NumberField component={TextField} label="Distance" name="distance" fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                      <CountrySelector name="country" label="Country" allowedCountries={IndeedSupportedCountries} required hideForbiddenCountries/>
                    </Grid>
                  </Grid>

                  <Grid item container spacing={1} mb={2}>
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
                      <NumberField component={TextField} label="Maximum Age (days)" name="maxAge" fullWidth />
                    </Grid>
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

export default SearchDialog;