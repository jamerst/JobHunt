import { Box } from "@material-ui/core";
import React, { FunctionComponent } from "react"
import { useResponsive } from "utils/hooks";

type TabPanelProps = {
  current: number,
  index: number,
  keepMounted?: boolean
}

const TabPanel:FunctionComponent<TabPanelProps> = (props) => {
  const r = useResponsive();
  return (
    <div
      role="tabpanel"
      hidden={props.current !== props.index}
      id={`tabpanel-${props.index}`}
      aria-labelledby={`tab-${props.index}`}
    >
      {(props.current === props.index || props.keepMounted) && (
        <Box py={3} px={r({md: 3})}>
          {props.children}
        </Box>
      )}
    </div>
  );
}

export default TabPanel;