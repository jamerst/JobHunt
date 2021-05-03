import { Chip, Grid } from "@material-ui/core"
import { gridColumnsTotalWidthSelector } from "@material-ui/data-grid"
import React, { useCallback } from "react"

export type Category = {
  id: number,
  name: string,
  colour?: "primary" | "secondary" | "default" | undefined,
  removable: boolean
}

type CategoriesProps = {
  categories: Category[],
  updateUrl: string,
  onCategoryAdd: (cat: Category) => void,
  onCategoryRemove: (id: number) => void
}

const Categories = (props: CategoriesProps) => {
  const removeCategory = useCallback(async (id: number) => {
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
  }, []);

  return (
    <Grid container>
      {props.categories.map(c =>
        (<Chip color={c.colour} label={c.name} key={c.id} onDelete={() => removeCategory(c.id)}/>)
      )}
    </Grid>
  )
}

export default Categories;