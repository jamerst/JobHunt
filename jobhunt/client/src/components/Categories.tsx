import React, { FunctionComponent, useCallback, useState } from "react"
import { IconButton, Chip, Tooltip, InputBase, Autocomplete, createFilterOptions, autocompleteClasses, chipClasses } from "@mui/material"
import Grid from "components/Grid";
import { Add } from "@mui/icons-material"
import makeStyles from "makeStyles";

export type Category = {
  id?: number,
  name: string,
  displayName?: string,
  colour?: "primary" | "secondary" | "default" | undefined
}

type CategoriesProps = {
  categories: Category[],
  updateUrl?: string,
  onCategoryAdd: (cats: Category[]) => void,
  onCategoryRemove: (cats: Category[]) => void,
  openByDefault?: boolean
}

const useStyles = makeStyles()((theme) => ({
  input: {
    fontSize: "0.8125rem",
    paddingLeft: "12px",
    paddingRight: "12px",
    background: theme.palette.action.selected,
    borderRadius: 32 / 2,
    height: 32,
    [`& .${autocompleteClasses.endAdornment}`]: {
      marginRight: 4
    },
  }
}));

const filter = createFilterOptions<Category>({ ignoreCase: true, trim: true });

const Categories:FunctionComponent<CategoriesProps> = ({ children, categories, updateUrl, onCategoryAdd, onCategoryRemove, openByDefault }) => {
  const [adding, setAdding] = useState<boolean>(openByDefault ?? false);
  const [newCategory, setNewCategory] = useState<Category | string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { classes, cx } = useStyles();

  const fetchCategories = useCallback(async (force: boolean = false) => {
    if (allCategories.length > 0 && !force) {
      return;
    }

    const response = await fetch("/api/categories");
    if (response.ok) {
      const data = await response.json() as Category[];
      setAllCategories(data);
      setLoading(false);
    } else {
      console.error(`API request failed: GET /api/categories, HTTP ${response.status}`);
    }
  }, [allCategories]);

  if (openByDefault === true) {
    fetchCategories();
  }

  const addCategory = useCallback(async (keepOpen: boolean) => {
    if (!newCategory) {
      return;
    }

    let newName;
    let newId;
    let refresh = false;
    if (typeof newCategory === "string") {
      newName = newCategory;
      refresh = true;
    } else {
      newName = newCategory?.name;
      newId = newCategory?.id;
    }

    if (!newName) {
      setAdding(false);
      return;
    }

    setNewCategory(null);

    const newCategories = [...categories];
    newCategories.push({ id: newId, name: newName });
    if (updateUrl) {
      const response = await fetch(updateUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(newCategories)
      });

      if (response.ok) {
        const data = await response.json();
        onCategoryAdd(data as Category[]);
        if (refresh) {
          fetchCategories(true);
        }
      } else {
        console.error(`API request failed: ${updateUrl}, HTTP ${response.status}`);
      }
    } else {
      onCategoryAdd(newCategories);
    }

    if (!keepOpen) {
      setAdding(false);
    }
  }, [categories, updateUrl, onCategoryAdd, newCategory, fetchCategories])

  const removeCategory = useCallback(async (id?: number) => {
    if (!id) return;

    const newCategories = categories.filter(c => c.id !== id);
    if (updateUrl) {
      const response = await fetch(updateUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(newCategories)
      });

      if (response.ok) {
        onCategoryRemove(newCategories);
      } else {
        console.error(`API request failed: ${updateUrl}, HTTP ${response.status}`);
      }
    } else {
      onCategoryRemove(newCategories);
    }
  }, [categories, updateUrl, onCategoryRemove]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if ((e.target as HTMLInputElement).value) {
        addCategory(true);
      } else {
        setAdding(false);
        setNewCategory(null);
      }
    } else if (e.key === "Escape") {
      setAdding(false);
      setNewCategory(null);
    }
  }, [addCategory]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (!(e.target as HTMLInputElement).value) {
      setAdding(false);
    }
  }, []);



  return (
    <Grid container spacing={1} alignItems="center">
      {children}
      {categories.map(c =>
        (<Grid item key={`category-${c.id}`}><Chip color={c.colour} label={c.name} onDelete={() => removeCategory(c.id)}/></Grid>)
      )}

      {
        adding &&
        <Grid item>
          <Autocomplete
            options={allCategories.filter(c1 => !categories.some(c2 => c2.id === c1.id))}
            getOptionLabel={(option) => option?.displayName ?? option?.name ?? ""}
            renderInput={(params) => {
              const { InputLabelProps, InputProps, ...rest } = params;
              return <InputBase
                {...rest}
                {...params.InputProps}
                className={cx(classes.input, chipClasses.root, chipClasses.label)}
                autoFocus
                placeholder="Enter a category"
              />
            }}
            freeSolo
            value={newCategory ?? ""}
            onChange={(_, val) => setNewCategory(val)}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              if (updateUrl && params.inputValue && !options.some((o) => params.inputValue.toLowerCase() === o.name.toLowerCase())) {
                filtered.push({
                  displayName: `Add "${params.inputValue}"`,
                  name: params.inputValue
                });
              }

              return filtered;
            }}
            loading={loading}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
          />
        </Grid>
      }

      <Grid item>
        <Tooltip title="Add category" placement="right">
          <IconButton size="small" onClick={() => { fetchCategories(false); setAdding(!adding); addCategory(false); }}><Add/></IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )
}

export default Categories;