import React from "react"
import { TabProps as MuiTabProps } from "@mui/material";

export type TabProps = {
  children?: React.ReactElement,
  keepMounted?: boolean,
  tabProps?: MuiTabProps
}

const Tab = (props: TabProps) => null;

export default Tab;