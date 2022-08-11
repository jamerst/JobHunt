import React, { useCallback, useMemo } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem } from "@mui/material";
import { Form } from "react-final-form";
import { Select, Switches, TextField } from "mui-rff";

import Grid from "components/Grid";
import WatchedPage from "types/models/WatchedPage";
import { useFeedback } from "utils/hooks";
import { getChangedProperties, hasDefined } from "utils/forms";

type WatchedPageDialogProps = {
  mode: "edit" | "create",
  companyId: number,
  watchedPage?: WatchedPage,
  open: boolean,
  onSave: () => void,
  onCancel: () => void
}

type FormPage = Omit<WatchedPage, "requiresJS"> & {
  requiresJS: 0 | 1
}

const WatchedPageDialog = ({ mode, companyId, watchedPage, open, onSave, onCancel }: WatchedPageDialogProps) => {
  const formPage: FormPage = useMemo(
    () => watchedPage
      ? { ...watchedPage, requiresJS: watchedPage.requiresJS ? 1 : 0 }
      : { id: 0, companyId: companyId, url: "", enabled: true, requiresJS: 0 },
    [watchedPage, companyId]
  );

  const { showLoading, showSuccess, showError, clear } = useFeedback();

  const onSubmit = useCallback(async (values: FormPage) => {
    showLoading();

    const requestData: WatchedPage = { ...values, requiresJS: !!values.requiresJS };

    if (mode === "create") {
      requestData.companyId = companyId;

      const response = await fetch("/api/odata/watchedpage", {
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
        console.error(`API request failed: POST /api/odata/watchedpage, HTTP ${response.status}`);
      }
    } else if (watchedPage) {
      const changed = getChangedProperties(watchedPage, requestData);

      if (hasDefined(changed)) {
        const response = await fetch(`/api/odata/watchedpage(${watchedPage.id})`, {
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
          console.error(`API request failed: PATCH /api/odata/watchedpage(${watchedPage.id}), HTTP ${response.status}`);
        }
      } else {
        onCancel();
        clear();
      }
    }
  }, [companyId, watchedPage, onSave, onCancel, showLoading, showSuccess, showError, clear]);

  return (
    <Dialog open={open} aria-labelledby="wp-modal-title" fullWidth>
      <DialogTitle id="wp-modal-title">{mode === "edit" ? "Edit Watched Page" : "Add New Watched Page"}</DialogTitle>
      <Form
        onSubmit={onSubmit}
        initialValues={formPage}
        subscription={{ submitting: true }}
        render={({ handleSubmit, submitting }) => (
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Switches name="enabled" data={{ label: "Enabled", value: "enabled" }} />
                </Grid>

                <Grid item xs={12} mb={2}>
                    <TextField label="URL" name="url" fullWidth required />
                  </Grid>

                <Grid item container xs={12} spacing={1} mb={2}>
                  <Grid item xs={12}>
                    <TextField label="CSS Selector" name="cssSelector" fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="CSS Blacklist" name="cssBlacklist" fullWidth />
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Select name="requiresJS" label="Requires JavaScript" required>
                    <MenuItem value={1}>Yes</MenuItem>
                    <MenuItem value={0}>No</MenuItem>
                  </Select>
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
  )
}

export default WatchedPageDialog;