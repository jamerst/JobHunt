import React, { useState } from "react"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Button, Grid, IconButton } from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";

type ExpandableSnippetProps = {
  maxHeight?: number
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  collapsed: {
    maxHeight: (props:ExpandableSnippetProps) => props.maxHeight ?? "30em",
    overflow: "hidden",
    maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)"
  }
}));

const ExpandableSnippet = (props:  React.PropsWithChildren<ExpandableSnippetProps>) => {
  const classes = useStyles(props);

  const [collapsed, setCollapsed] = useState<boolean>(true);

  return (
    <Grid container>
      <Grid item className={collapsed ? classes.collapsed : ""}>
        {props.children}
      </Grid>
      <Grid item container justify="center">
        <IconButton onClick={() => setCollapsed(!collapsed)}>
          {collapsed ?
            (<ExpandMore fontSize="large"/>)
            :
            (<ExpandLess fontSize="large"/>)
          }
        </IconButton>
      </Grid>
    </Grid>
  );
}

export default ExpandableSnippet;