import React, { forwardRef } from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps, GridSize } from '@mui/material';
import makeStyles from 'makeStyles';
import { CSSObject } from 'tss-react';

type GridProps = MuiGridProps & { xxl?: boolean | GridSize | undefined };

const useStyles = makeStyles<GridProps>()((theme, props) => {
  let root: CSSObject = {};
  if (props.xxl) {
    let percentage;
    const i = props.xxl as number;
    if (i) {
      percentage = `${(i / 12) * 100}%`;
      root = {
        [theme.breakpoints.up("xxl")]: {
          flexGrow: 0,
          maxWidth: percentage,
          flexBasis: percentage
        }
      }
    } else {
      root = {
        [theme.breakpoints.up("xxl")]: {
          flexGrow: 1,
          maxWidth: "100%",
          flexBasis: 0
        }
      }
    }
  }

  return { root: root };
});

const Grid = forwardRef((props:GridProps, ref:React.ForwardedRef<HTMLDivElement>) => {
  const { classes, cx } = useStyles(props);
  let className = props.className;
  const muiProps = { ...props, xxl: undefined };

  if (props.item) {
    className = cx(className, classes.root);
  }

  return <MuiGrid ref={ref} {...muiProps} className={className} />;
});

export default Grid;