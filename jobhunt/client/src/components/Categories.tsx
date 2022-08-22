import React, { PropsWithChildren, useCallback, useMemo, useState } from "react"
import { IconButton, Chip, Tooltip, InputBase, Autocomplete, createFilterOptions, autocompleteClasses, chipClasses, AutocompleteRenderInputParams, FilterOptionsState } from "@mui/material"
import Grid from "components/Grid";
import { Add } from "@mui/icons-material"
import makeStyles from "makeStyles";
import ICategoryLink from "types/models/ICategoryLink";
import Category from "types/models/Category";
import { ODataSingleResult } from "types/odata/ODataSingleResult";
import { ODataMultipleResult } from "types/odata/ODataMultipleResult";
import { useFeedback } from "utils/hooks";

type CategoryOption = Category & {
  displayName?: string
}

type CategoryRequest = Partial<Omit<ICategoryLink, "category">> & {
  category?: Partial<Category>
}

type CategoriesProps = {
  categories: ICategoryLink[],
  fetchUrl: string,
  createUrl: string,
  getDeleteUrl: (categoryId: number) => string,
  getEntity: (c: Partial<ICategoryLink>) => Partial<ICategoryLink>,
  onCategoryAdded: (cat: ICategoryLink) => void,
  onCategoryDeleted: (id: number) => void
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

const getOptionLabel = (o: string | CategoryOption) => {
  const category = o as CategoryOption;
  if (category) {
    return category.displayName ?? category.name;
  } else {
    return o as string;
  }
};

const filter = createFilterOptions<CategoryOption>({ ignoreCase: true, trim: true });

const Categories = ({ children, categories, fetchUrl, createUrl, getDeleteUrl, getEntity, onCategoryAdded, onCategoryDeleted }: PropsWithChildren<CategoriesProps>) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [newCategory, setNewCategory] = useState<Category | string | null>(null);

  const { classes, cx } = useStyles();

  const { showError, clear } = useFeedback();

  const fetchCategories = useCallback(async () => {
    if (allCategories.length > 0) {
      return;
    }

    const response = await fetch(fetchUrl);
    if (response.ok) {
      const data = await response.json() as ODataMultipleResult<Category>;
      setAllCategories(data.value);
      setLoading(false);
    } else {
      console.error(`API request failed: GET ${fetchUrl}, HTTP ${response.status}`);
    }
  }, [allCategories, fetchUrl]);

  const addCategory = useCallback(async (keepOpen: boolean) => {
    if (!newCategory) {
      return;
    }

    let isNewCategory = false;
    const requestData: CategoryRequest = getEntity({});
    if (typeof newCategory === "string") {
      isNewCategory = true;
      requestData.category = {
        name: newCategory
      };
    } else if (!newCategory.id) {
      isNewCategory = true;
      requestData.category = {
        name: newCategory.name
      };
    } else {
      requestData.categoryId = newCategory.id;
    }

    const response = await fetch(createUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    if (response.ok) {
      clear();
      const data = await response.json() as ICategoryLink;

      if (data) {
        if (isNewCategory) {
          data.category = { id: data.categoryId, name: requestData.category!.name! };
          setAllCategories((c) => [...c, { id: data.categoryId, name: data.category.name }]);
        } else {
          data.category = allCategories.find(c => c.id === data.categoryId)!;
        }

        onCategoryAdded(data);
      }
    } else {
      showError();
      console.error(`API request failed: POST ${createUrl}, HTTP ${response.status}`);
    }

    setNewCategory(null);

    if (!keepOpen) {
      setOpen(false);
    }
  }, [createUrl, newCategory, allCategories, getEntity, onCategoryAdded, clear, showError]);

  const onClickAdd = useCallback(() => {
    fetchCategories();
    setOpen(o => !o);
    addCategory(false);
  }, [fetchCategories, addCategory]);

  const removeCategory = useCallback((id?: number) => async () => {
    if (!id) {
      return;
    }

    const url = getDeleteUrl(id);
    const response = await fetch(url, { method: "DELETE" });
    if (response.ok) {
      clear();
      onCategoryDeleted(id);

      const data = await response.json() as ODataSingleResult<boolean>;
      if (data?.value === true) {
        // remove category option if category deleted
        setAllCategories((c) => c.filter(x => x.id !== id));
      }
    } else {
      showError();
      console.error(`API request failed: POST ${url}, HTTP ${response.status}`);
    }
  }, [getDeleteUrl, onCategoryDeleted, clear, showError]);

  const onChange = useCallback((_: React.SyntheticEvent, val: Category | string | null) => setNewCategory(val), []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if ((e.target as HTMLInputElement).value) {
        addCategory(true);
      } else {
        setOpen(false);
        setNewCategory(null);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setNewCategory(null);
    }
  }, [addCategory]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (!(e.target as HTMLInputElement).value) {
      setOpen(false);
    }
  }, []);

  const renderInput = useCallback((params: AutocompleteRenderInputParams) => {
    const { InputLabelProps, InputProps, ...rest } = params;
    return <InputBase
      {...rest}
      {...InputProps}
      className={cx(classes.input, chipClasses.root, chipClasses.label)}
      autoFocus
      placeholder="Enter a category"
    />
  }, [cx, classes]);

  const filterOptions = useCallback((options: CategoryOption[], params: FilterOptionsState<CategoryOption>) => {
    const filtered = filter(options, params);
    if (params.inputValue
      && !options.some((c) => params.inputValue.toLowerCase() === c.name.toLowerCase())
      && !allCategories.some(c => params.inputValue.toLowerCase() === c.name.toLowerCase()))
    {
      filtered.push({
        id: 0,
        displayName: `Add "${params.inputValue}"`,
        name: params.inputValue
      });
    }

    return filtered
  }, [allCategories]);

  const filteredOptions = useMemo(() =>
    allCategories.filter(c1 => !categories.some(c2 => c2.categoryId === c1.id)),
    [allCategories, categories]
  );

  return (
    <Grid container spacing={1} alignItems="center">
      {children}
      {categories.map(c =>
        (<Grid item key={`category-${c.categoryId}`}><Chip label={c.category.name} onDelete={removeCategory(c.categoryId)}/></Grid>)
      )}

      {
        open &&
        <Grid item>
          <Autocomplete
            options={filteredOptions}
            getOptionLabel={getOptionLabel}
            renderInput={renderInput}
            freeSolo
            value={newCategory ?? ""}
            onChange={onChange}
            filterOptions={filterOptions}
            loading={loading}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
          />
        </Grid>
      }

      <Grid item>
        <Tooltip title="Add category" placement="right">
          <IconButton size="small" onClick={onClickAdd}><Add/></IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )
}

export default Categories;