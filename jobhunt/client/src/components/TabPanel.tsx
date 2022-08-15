import React, { PropsWithChildren } from "react"
import { Box } from "@mui/material";
import makeStyles from "makeStyles";

export type TabPanelProps = {
  current: number,
  index: number,
  id: string
}

const useStyles = makeStyles()((theme) => ({
  box: {
    padding: [theme.spacing(3), theme.spacing(1)],
    [`${theme.breakpoints.up("md")}`]: {
      padding: theme.spacing(3)
    }
  }
}));

const TabPanel = ({ current, index, id, children }: PropsWithChildren<TabPanelProps>) => {
  const { classes } = useStyles();

  return (
    <div
      role="tabpanel"
      hidden={current !== index}
      id={id}
      aria-labelledby={`tab-${id}`}
    >
      {current === index && (
        <Box className={classes.box}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default TabPanel;