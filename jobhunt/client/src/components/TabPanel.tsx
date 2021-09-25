import { Box } from "@mui/material";
import React, { FunctionComponent } from "react"

type TabPanelProps = {
  current: number,
  index: number,
  keepMounted?: boolean
}

const TabPanel:FunctionComponent<TabPanelProps> = (props) => {
  return (
    <div
      role="tabpanel"
      hidden={props.current !== props.index}
      id={`tabpanel-${props.index}`}
      aria-labelledby={`tab-${props.index}`}
    >
      {(props.current === props.index || props.keepMounted) && (
        <Box py={3} sx={{px: { md: 3 }}}>
          {props.children}
        </Box>
      )}
    </div>
  );
}

export default TabPanel;