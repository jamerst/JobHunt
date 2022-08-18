import { PropsWithChildren } from "react"
import { TabProps as MuiTabProps } from "@mui/material";

export type TabProps = PropsWithChildren<{
  keepMounted?: boolean,
  tabProps?: MuiTabProps
}>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Tab = (props: TabProps) => null;

export default Tab;