import React, { useCallback, useState } from "react"
import { IconButton, Chip, Grid, Tooltip, InputBase } from "@material-ui/core"
import { Add } from "@material-ui/icons"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

export type Category = {
  id?: number,
  name: string,
  colour?: "primary" | "secondary" | "default" | undefined
}

type CategoriesProps = {
  categories: Category[],
  updateUrl: string,
  onCategoryAdd: (cats: Category[]) => void,
  onCategoryRemove: (id: number) => void
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  input: {
    fontSize: "0.8125rem",
    paddingLeft: "12px",
    paddingRight: "12px",
    background: theme.palette.action.selected
  }
}));

const Categories = (props: CategoriesProps) => {
  const [adding, setAdding] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");

  const classes = useStyles();

  const addCategory = useCallback(async (name: string) => {
    const newCategories = [...props.categories];
    newCategories.push({ name: name });
    const response = await fetch(props.updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(newCategories)
    });

    if (response.ok) {
      const data = await response.json();
      props.onCategoryAdd(data as Category[]);
    } else {
      console.error(`API request failed: ${props.updateUrl}, HTTP ${response.status}`);
    }

    setAdding(false);
    setNewName("");
  }, [props])

  const removeCategory = useCallback(async (id?: number) => {
    if (!id) return;

    const newCategories = props.categories.filter(c => c.id !== id);
    const response = await fetch(props.updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(newCategories)
    });

    if (response.ok) {
      props.onCategoryRemove(id);
    } else {
      console.error(`API request failed: ${props.updateUrl}, HTTP ${response.status}`);
    }
  }, [props]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (e.currentTarget.value) {
        addCategory(e.currentTarget.value);
      } else {
        setAdding(false);
        setNewName("");
      }
    } else if (e.key === "Escape") {
      setAdding(false);
      setNewName("");
    }
  }, [addCategory]);

  return (
    <Grid container spacing={1}>
      {props.categories.map(c =>
        (<Grid item><Chip color={c.colour} label={c.name} key={c.id} onDelete={() => removeCategory(c.id)}/></Grid>)
      )}

      { adding ?
        (<Grid item>
          <InputBase
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            onKeyUp={handleKeyUp}
            autoFocus
            className={`MuiChip-root MuiChip-label ${classes.input}`}
          />
        </Grid>)
        : (null)
      }

      <Grid item>
        <Tooltip title="Add category" placement="right">
          <IconButton size="small" onClick={() => { setAdding(!adding); if (newName) addCategory(newName); }}><Add/></IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )
}

export default Categories;