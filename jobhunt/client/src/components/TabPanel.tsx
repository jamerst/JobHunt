import { Box } from "@material-ui/core";
import React, { FunctionComponent } from "react"

type TabPanelProps = {
  current: number,
  index: number
}

const TabPanel:FunctionComponent<TabPanelProps> = (props) => {
  return (
    <div
      role="tabpanel"
      hidden={props.current !== props.index}
      id={`tabpanel-${props.index}`}
      aria-labelledby={`tab-${props.index}`}
    >
      {props.current === props.index && (
        <Box p={3}>
          {props.children}
        </Box>
      )}
    </div>
  );
}

export default TabPanel;