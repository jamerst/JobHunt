import React, { useState } from "react"
import makeStyles from "makeStyles";
import { IconButton } from "@mui/material";
import Grid from "components/Grid";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

type ExpandableSnippetProps = {
  maxHeight?: number,
  hidden?: boolean
}

const useStyles = makeStyles<ExpandableSnippetProps>()((theme, props) => ({
  collapsed: {
    maxHeight: props.maxHeight ?? "30em",
    overflow: "hidden",
    maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)"
  }
}));

const ExpandableSnippet = (props:  React.PropsWithChildren<ExpandableSnippetProps>) => {
  const { classes } = useStyles(props);

  const [collapsed, setCollapsed] = useState<boolean>(true);

  return (
    <Grid container>
      <Grid item className={collapsed && !props.hidden ? classes.collapsed : ""}>
        {props.children}
      </Grid>
      <Grid item container justifyContent="center">
        {!props.hidden ? (
          <IconButton onClick={() => setCollapsed(!collapsed)} size="large">
            {collapsed ?
              (<ExpandMore fontSize="large"/>)
              :
              (<ExpandLess fontSize="large"/>)
            }
          </IconButton>
        ) : null }
      </Grid>
    </Grid>
  );
}

export default ExpandableSnippet;