import React from "react"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Helmet } from "react-helmet";
import { ODataColumnVisibilityModel, ODataGridInitialState } from "o-data-grid";
import ODataGrid from "components/odata/ODataGrid";

import "dayjs/locale/en-gb"

import { getCompanyColumns } from "odata/CompanyColumns";
import CompanyDialog from "components/model-dialogs/CompanyDialog";

const columnVisibility: ODataColumnVisibilityModel = {
  "avgSalary": { xs: false, xl: true },
  "jobs@odata.count": { xs: false, md: true },
  "latestJob": { xs: false, md: true },
  "latestPageUpdate": { xs: false, xl: true },
  "companyCategories": { xs: false, xxl: true },
}

const columns = getCompanyColumns();

const initialState: ODataGridInitialState = {
  sorting: {
    sortModel: [{ field: "name", sort: "asc" }]
  },
  pagination: {
    paginationModel: {
      pageSize: 15
    }
  }
}

const alwaysSelect = ["id"];

const Companies = () => (
  <div>
    <Helmet>
      <title>Companies | JobHunt</title>
    </Helmet>

    <ODataGrid
      url="/api/odata/Company"
      columns={columns}
      columnVisibilityModel={columnVisibility}
      alwaysSelect={alwaysSelect}
      initialState={initialState}
      filterBuilderProps={{ localizationProviderProps: { dateAdapter: AdapterDayjs, adapterLocale: 'en-gb' } }}
    />

    <CompanyDialog mode="create" />
  </div>
);

export default Companies;