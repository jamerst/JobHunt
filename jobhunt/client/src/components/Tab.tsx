import { PropsWithChildren } from "react"
import { TabProps as MuiTabProps } from "@mui/material";

type ActualTabProps = {
  keepMounted?: boolean,
  tabProps?: MuiTabProps
}

export type TabProps = PropsWithChildren<ActualTabProps>;

const Tab = (props: TabProps) => null;

export default Tab;