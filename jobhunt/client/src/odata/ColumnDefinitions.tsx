import React from "react";
import ODataCategoryFilter, { getCategoryFilterString } from "components/odata/ODataCategoryFilter";
import { ODataGridColDef } from "o-data-grid";

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
  renderCell: (params) => params.row[navigationCollection].map((c: any) => c["category/name"]).join(", "),
  ...props
});
