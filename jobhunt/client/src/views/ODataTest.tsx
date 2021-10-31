import React from "react";
import ODataGrid, { ODataGridColDef } from "components/ODataGrid";

const columns: ODataGridColDef[] = [
  { field: "Title", flex: 1 },
  { field: "Company/Name", expand: { navigationField: "Company", select: "Name" }, flex: 1 },
  { field: "Company/Location", expand: { navigationField: "Company", select: "Location" }, flex: 1 }
]

export const ODataTest = () => {
  return (
    <ODataGrid
      url="/api/odata/job"
      columns={columns}
      idField="Id"
      defaultSortModel={[ { field: "Company/Name", sort: "asc" } ]}
    />

  )
}