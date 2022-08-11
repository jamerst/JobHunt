import React, { Fragment, useEffect, useState } from "react"
import { Tab, Tabs as MuiTabs, TabsProps as MuiTabsProps } from "@mui/material";
import TabPanel from "./TabPanel";
import { TabProps } from "./Tab";
import { useMountEffect } from "utils/hooks";

type TabsProps = MuiTabsProps & {
  labels: string[],
  children: React.ReactElement<TabProps>[]
}

const Tabs = (props: TabsProps) => {
  const [current, setCurrent] = useState(0);

  useMountEffect(() => {
    if (window.location.hash) {
      const index = props.labels.findIndex((l) => ToKebabCase(l) === window.location.hash.slice(1));
      if (index > -1) {
        setCurrent(index);
      }
    }
  });

  useEffect(() => {
    if (!window.location.hash && current === 0) {
      return;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${ToKebabCase(props.labels[current])}`);
  }, [current, props.labels]);

  return (
    <Fragment>
      <MuiTabs value={current} onChange={(_, t) => setCurrent(t)}>
        {React.Children.map(props.children, (tab, i) => (
          <Tab {...tab.props.tabProps} label={props.labels[i]} id={`tab-${ToKebabCase(props.labels[i])}`} />
        ))}
      </MuiTabs>
      {React.Children.map(props.children, (tab, i) => (
        <TabPanel keepMounted={tab.props.keepMounted} current={current} index={i} id={ToKebabCase(props.labels[i])}>
          <Fragment>
            {tab.props.children}
          </Fragment>
        </TabPanel>
      ))}
    </Fragment>
  )
}

// eslint-disable-next-line no-useless-escape
const ToKebabCase = (input: string) => input.replace(" ", "-").replace("[\W-]+/g", "").toLowerCase();

export default Tabs;