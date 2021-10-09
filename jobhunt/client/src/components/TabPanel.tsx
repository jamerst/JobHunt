import { Box } from "@mui/material";
import React from "react"

export type TabPanelProps = {
  current: number,
  index: number,
  keepMounted?: boolean,
  children?: React.ReactElement,
  id: string
}

const TabPanel = (props:TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={props.current !== props.index}
      id={props.id}
      aria-labelledby={`tab-${props.id}`}
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