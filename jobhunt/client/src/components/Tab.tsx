import React, { FunctionComponent, PropsWithChildren } from "react"
import { TabProps as MuiTabProps } from "@mui/material";

type ActualTabProps = {
  keepMounted?: boolean,
  tabProps?: MuiTabProps
}

export type TabProps = PropsWithChildren<ActualTabProps>;

const Tab: FunctionComponent<TabProps> = (props: TabProps) => null;

export default Tab;