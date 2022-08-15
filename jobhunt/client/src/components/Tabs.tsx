import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Tab, Tabs as MuiTabs, TabsProps as MuiTabsProps } from "@mui/material";
import TabPanel from "./TabPanel";
import { TabProps } from "./Tab";
import { useMountEffect } from "utils/hooks";

type TabsProps = MuiTabsProps & {
  labels: string[],
  children: React.ReactElement<TabProps>[]
}

const Tabs = ({ labels, children }: TabsProps) => {
  const [current, setCurrent] = useState(0);

  useMountEffect(() => {
    if (window.location.hash) {
      const index = labels.findIndex((l) => ToKebabCase(l) === window.location.hash.slice(1));
      if (index > -1) {
        setCurrent(index);
      }
    }
  });

  useEffect(() => {
    if (!window.location.hash && current === 0) {
      return;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${ToKebabCase(labels[current])}`);
  }, [current, labels]);

  const onChange = useCallback((_: React.SyntheticEvent, v: any) => setCurrent(v), []);

  const tabs = useMemo(() =>
    React.Children.map(children, (tab, i) => (
      <Tab {...tab.props.tabProps} label={labels[i]} id={`tab-${ToKebabCase(labels[i])}`} />)
    ),
    [children, labels]
  );

  const tabPanels = useMemo(() =>
    React.Children.map(children, (tab, i) => (
      <TabPanel current={current} index={i} id={ToKebabCase(labels[i])}>
        <Fragment>
          {tab.props.children}
        </Fragment>
      </TabPanel>)
    ),
    [children, labels, current]
  );

  return (
    <Fragment>
      <MuiTabs value={current} onChange={onChange}>
        {tabs}
      </MuiTabs>
      {tabPanels}
    </Fragment>
  )
}

// eslint-disable-next-line no-useless-escape
const ToKebabCase = (input: string) => input.replace(" ", "-").replace("[\W-]+/g", "").toLowerCase();

export default Tabs;