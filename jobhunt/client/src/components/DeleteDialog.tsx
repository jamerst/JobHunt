import React, { useCallback } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

type DeleteDialogProps = {
  open: boolean,
  entityName: string,
  deleteUrl?: string,
  onConfirm?: () => void,
  onClose: () => void
}

const DeleteDialog = ({ open, entityName, deleteUrl, onConfirm, onClose }: DeleteDialogProps) => {
  const onDelete = useCallback(async () => {
    if (deleteUrl) {
      const response = await fetch(deleteUrl, { method: "DELETE" });

      if (!response.ok) {
        console.error(`API request failed: DELETE ${deleteUrl}, HTTP ${response.status}`);
      }
    }

    if (onConfirm) {
      onConfirm();
    }

    onClose();
  }, [deleteUrl, onConfirm]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Confirm</DialogTitle>
      <DialogContent>
        <Typography variant="body1">Are you sure you want to delete this {entityName}? <strong>This action cannot be undone.</strong></Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" onClick={onDelete}>Delete</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteDialog;