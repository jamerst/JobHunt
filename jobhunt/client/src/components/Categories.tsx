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
  updateUrl: string,
  onCategoryAdd: (cats: Category[]) => void,
  onCategoryRemove: (id: number) => void
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

const Categories:FunctionComponent<CategoriesProps> = (props) => {
  const [adding, setAdding] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<Category | string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { classes, cx } = useStyles();

  const fetchCategories = useCallback(async (force: boolean) => {
    if (allCategories.length > 0 && !force) {
      return 0;
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

  const addCategory = useCallback(async (keepOpen: boolean) => {
    if (!newCategory) {
      return;
    }

    let newName;
    let refresh = false;
    if (typeof newCategory === "string") {
      newName = newCategory;
      refresh = true;
    } else {
      newName = newCategory?.name;
    }

    if (!newName) {
      setAdding(false);
      setNewCategory(null);
      return;
    }

    const newCategories = [...props.categories];
    newCategories.push({ name: newName });
    const response = await fetch(props.updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(newCategories)
    });

    if (response.ok) {
      const data = await response.json();
      props.onCategoryAdd(data as Category[]);
      if (refresh) {
        fetchCategories(true);
      }
    } else {
      console.error(`API request failed: ${props.updateUrl}, HTTP ${response.status}`);
    }

    if (!keepOpen) {
      setAdding(false);
    }
    setNewCategory(null);
  }, [props, newCategory, fetchCategories])

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
    if (!e.currentTarget.value) {
      setAdding(false);
    }
  }, []);

  return (
    <Grid container spacing={1}>
      {props.children}
      {props.categories.map(c =>
        (<Grid item  key={`category-${c.id}`}><Chip color={c.colour} label={c.name} onDelete={() => removeCategory(c.id)}/></Grid>)
      )}

      { adding ?
        (<Grid item>
          <Autocomplete
            options={allCategories.filter(c1 => !props.categories.some(c2 => c2.id === c1.id))}
            getOptionLabel={(option) => option?.displayName ?? option?.name ?? ""}
            renderInput={(params) => {
              const { InputLabelProps, InputProps, ...rest } = params;
              return <InputBase
                {...params.InputProps}
                {...rest}
                className={cx(classes.input, chipClasses.root, chipClasses.label)}
                onKeyUp={handleKeyUp}
                onBlur={handleBlur}
                autoFocus
                placeholder="Enter a category"
              />
            }}
            freeSolo
            value={newCategory}
            onChange={(_, val) => setNewCategory(val)}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              if (params.inputValue && !options.some((o) => params.inputValue.toLowerCase() === o.name.toLowerCase())) {
                filtered.push({
                  displayName: `Add "${params.inputValue}"`,
                  name: params.inputValue
                });
              }

              return filtered;
            }}
            loading={loading}
          />
        </Grid>)
        : (null)
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