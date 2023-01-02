import React, { useCallback, useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import Grid from "components/Grid";
import Tab from "components/Tab";
import Tabs from "components/Tabs";
import { FilterBuilder } from "o-data-grid";
import { getJobColumns } from "odata/JobColumns";
import { DateRange, DateRangePicker } from "components/forms/DateRangePicker";

const schema = getJobColumns();
const tabLabels = ["Summary", "Map"];

export const Statistics = () => {
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  const onDateRangeChange = useCallback((d: DateRange) => setDateRange(d), []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8} lg={6}>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange}/>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore/>}>
            <Typography>Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FilterBuilder
              schema={schema}
            />
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Grid item xs={12}>
        <Tabs labels={tabLabels}>
          <Tab>

          </Tab>
          <Tab>
            <Typography variant="body1"><em>Coming Soon</em></Typography>
          </Tab>
        </Tabs>
      </Grid>
    </Grid>
  );
}