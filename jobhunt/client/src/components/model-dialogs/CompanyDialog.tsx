import React, { Fragment, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FilterOptionsState, MenuItem } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

import { Autocomplete, Select, TextField } from "mui-rff";
import { Form } from "react-final-form";

import makeStyles from "makeStyles";

import HideOnScroll from "components/HideOnScroll";
import Grid from "components/Grid";
import NumberField from "components/forms/NumberField";

import Company from "types/models/Company";
import CompanyName from "types/models/CompanyName";
import { getChangedProperties, hasDefined } from "utils/forms";
import ODataBatchRequest from "types/odata/ODataBatchRequest";
import ODataBatchResponse from "types/odata/ODataBatchResponse";
import { toBase64Json } from "utils/requests";
import { useFeedback } from "utils/hooks";

type CompanyDialogProps = {
  mode: "edit" | "create",
  company?: Company,
  onUpdate?: () => any
}

type RequestCompany = Omit<Company, "watched" | "blacklisted" | "jobs" | "companyCategories" | "watchedPages">

type FormCompany = Omit<RequestCompany, "recruiter"> & {
  recruiter: 0 | 1
}

const useStyles = makeStyles()(theme => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

const options: CompanyName[] = [];
const getOptionLabel = (c: CompanyName | string) => (c as CompanyName)?.name ?? "";

const CompanyDialog = ({ mode, company, onUpdate }: CompanyDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const { classes } = useStyles();
  const navigate = useNavigate();

  const formCompany: FormCompany = useMemo(
    () => company
      ? { ...company, recruiter: company.recruiter ? 1 : 0 }
      : { id: 0, name: "", location: "", recruiter: 0, alternateNames: [] },
    [company]
  );

  const onFabClick = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const fetchOptions = useCallback((options: CompanyName[], params: FilterOptionsState<CompanyName>): CompanyName[] => {
    return [{ id: 0, companyId: company?.id ?? 0, name: params.inputValue }];
  }, [company]);

  const onSubmit = useCallback(async (values: FormCompany) => {
    showLoading();

    const requestData: RequestCompany = { ...values, recruiter: !!values.recruiter };

    if (mode === "create") {
      const response = await fetch("/api/odata/company", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const responseData = await response.json() as Company;
        showSuccess();
        if (responseData) {
          navigate(`/company/${responseData.id}`);
        }
      } else {
        showError();
        console.error(`API request failed: POST /api/odata/company, HTTP ${response.status}`);
      }
    } else if (mode === "edit" && company) {
      const batch: ODataBatchRequest = { requests: [] };

      const changed = getChangedProperties(company, requestData);

      // can't use PATCH with collections
      if (changed.alternateNames !== undefined) {
        delete changed.alternateNames;
      }

      // only send patch request if fields have actually changed
      if (hasDefined(changed)) {
        batch.requests.push({
          id: "patch-company",
          method: "PATCH",
          url: `/api/odata/company(${company.id})`,
          headers: { "Content-Type": "application/json" },
          body: toBase64Json(changed)
          // not sure why these have to be encoded as base64, doesn't appear to be documented or standardised
        });
      }

      // send delete requests for removed names
      company.alternateNames
        .filter(n1 => !requestData.alternateNames.some(n2 => n1.id === n2.id))
        .forEach((n) => batch.requests.push({
          id: `delete-company-name-${n.id}`,
          method: "DELETE",
          url: `/api/odata/companyName(${n.id})`
        }));

      // send post requests to create new names
      requestData.alternateNames
        .filter(n => n.id === 0)
        .forEach((n, i) => batch.requests.push({
          id: `post-company-name-${n.name}-${i}`,
          method: "POST",
          url: `/api/odata/companyName`,
          headers: { "Content-Type": "application/json" },
          body: toBase64Json(n)
        }));

      if (batch.requests.length) {
        const response = await fetch(`/api/odata/$batch`, {
          method: "POST",
          body: JSON.stringify(batch),
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json() as ODataBatchResponse;

          let error = false;
          if (data) {
            data.responses.forEach(r => {
              if (!r.status.toString().startsWith("2")) {
                error = true;
                console.error(`API batch request failed: ${r.id}, HTTP ${r.status}`);
              }
            })
          }

          if (!error) {
            showSuccess();
            if (onUpdate) {
              onUpdate();
            }
          } else {
            showError();
          }
        } else {
          showError();
          console.error(`API request failed: PATCH /api/odata/company(${company.id}), HTTP ${response.status}`);
        }
      } else {
        clear();
      }
    }

    setOpen(false);
  }, [mode, company, onUpdate, navigate, showLoading, showSuccess, showError, clear]);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Fragment>
      <HideOnScroll>
        <Fab className={classes.fab} color="secondary" aria-label={mode === "edit" ? "Edit Company" : "Add New Company"} onClick={onFabClick}>
          {mode === "edit" ? <Edit /> : <Add />}
        </Fab>
      </HideOnScroll>
      <Dialog open={open} onClose={onClose} aria-labelledby="company-modal-title" fullWidth>
        <DialogTitle id="company-modal-title">{mode === "edit" ? "Edit Company" : "Add New Company"}</DialogTitle>
        <Form
          onSubmit={onSubmit}
          initialValues={formCompany}
          subscription={{ submitting: true }}
          render={({ handleSubmit, submitting }) => (
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Name" name="name" fullWidth required />
                  </Grid>
                  <Grid item xs={12} mb={2}>
                    <Autocomplete
                      label="Alternate Names"
                      name="alternateNames"
                      multiple
                      freeSolo
                      options={options}
                      size="small"
                      filterOptions={fetchOptions}
                      getOptionLabel={getOptionLabel}
                    />
                  </Grid>
                  <Grid item xs={12} mb={2}>
                    <Select name="recruiter" label="Recruiter">
                      <MenuItem value={1}>Yes</MenuItem>
                      <MenuItem value={0}>No</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Location" name="location" fullWidth />
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
                  <Grid item container xs={12} spacing={1} mt={2} mb={2}>
                    <Grid item xs={12}>
                      <TextField label="Website" name="website" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Glassdoor Profile" name="glassdoor" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="LinkedIn Profile" name="linkedin" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Endole Profile" name="endole" fullWidth size="small" />
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

export default CompanyDialog;