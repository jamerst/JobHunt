import React, { useCallback, useState } from "react";
import { Button, Link, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import makeStyles from "makeStyles";
import Grid from "components/Grid";


type EditableMarkdownProps = {
  value?: string,
  emptyText?: string,
  label?: string,
  onSave: (val: string) => void,
}

const remarkPlugins = [remarkGfm];

const useStyles = makeStyles()(() => ({
  root: {
    position: "relative"
  },
  buttons: {
    position: "absolute",
    pointerEvents: "none",
    "& button": {
      pointerEvents: "all"
    }
  },
  textField: {
    "& textarea": {
      fontFamily: "monospace"
    }
  }
}))

const components = {
  a: Link,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: ({ isHeader, ...props }: any) => <TableRow {...props}/>,
  th: ({ isHeader, ...props }: any) => <TableCell {...props}/>,
  td: ({ isHeader, ...props }: any) => <TableCell {...props}/>
}

const EditableMarkdown = ({ value, emptyText, label, onSave }: EditableMarkdownProps) => {
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(value ?? "");

  const { classes } = useStyles();

  const onEditSave = useCallback(() => {
    if (!editing) {
      setEditing(true);
    } else {
      onSave(editingValue);
      setEditing(false);
    }
  }, [editing, editingValue, onSave]);

  const onDiscard = useCallback(() => {
    setEditing(false);
    setEditingValue(value ?? "");
  }, [value]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditingValue(e.target.value);
  }, []);

  return (
    <Grid container className={classes.root}>
      <Grid item xs={12} container spacing={1} justifyContent="flex-end" mb={2} className={editing ? "" : classes.buttons}>
        { editing && <Grid item><Button color="primary" variant="outlined" size="small" onClick={onDiscard}>Discard</Button></Grid>}
        <Grid item>
          <Button color="primary" variant="contained" size="small" onClick={onEditSave}>{editing ? "Save" : "Edit"}</Button>
        </Grid>
      </Grid>

      {
        editing
          ? <Grid item xs={12}><TextField rows={20} multiline fullWidth variant="outlined" label={label} value={editingValue} onChange={onChange} className={classes.textField} /></Grid>
          : <Grid item xs={12}><ReactMarkdown remarkPlugins={remarkPlugins} components={components}>{value ? value : emptyText ?? ""}</ReactMarkdown></Grid>
      }
    </Grid>
  );
}

export default EditableMarkdown;