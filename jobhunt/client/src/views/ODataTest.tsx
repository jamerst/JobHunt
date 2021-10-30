import React from "react";
import ODataGrid, { ODataGridColDef } from "components/ODataGrid";

const columns: ODataGridColDef[] = [
  { field: "Id" },
  { field: "Title" }
]

export const ODataTest = () => {
  return (
    <ODataGrid
      baseUrl="/api/jobs/query"
      columns={columns}
      idSelector={(j) => j.Id}
    />
  )
}