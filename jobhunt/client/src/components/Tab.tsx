import { PropsWithChildren } from "react"
import { TabProps as MuiTabProps } from "@mui/material";

export type TabProps = PropsWithChildren<{
  keepMounted?: boolean,
  tabProps?: MuiTabProps
}>

const Tab = (props: TabProps) => null;

export default Tab;