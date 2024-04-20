import React from "react";
import ODataCategoryFilter, { getCategoryFilterString } from "components/odata/ODataCategoryFilter";
import { ODataGridColDef } from "o-data-grid";
import ICategoryLink from "types/models/ICategoryLink";

export const createCategoryColumn = (field: string, navigationCollection: string, fetchUrl: string, props?: Partial<ODataGridColDef>): ODataGridColDef => ({
  field: field,
  headerName: "Categories",
  label: "Category",
  expand: {
    navigationField: navigationCollection,
    expand: {
      navigationField: "category",
      select: "name"
    }
  },
  sortable: false,
  flex: 1,
  renderCustomFilter: (value, setValue) => <ODataCategoryFilter value={value} setValue={setValue} fetchUrl={fetchUrl} />,
  getCustomFilterString: (_, value) => getCategoryFilterString(value, navigationCollection),
  renderCell: (params) => params.row[navigationCollection]
    ? (params.row[navigationCollection] as ICategoryLink[]).map((c) => c.category.name).join(", ")
    : "",
  ...props
});
