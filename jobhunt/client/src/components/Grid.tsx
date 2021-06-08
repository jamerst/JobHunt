import React, { forwardRef } from 'react';
import { Grid as MuiGrid, GridProps } from '@material-ui/core';
import { makeStyles, StyleRules } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

/*
  Sourced from https://github.com/mui-org/material-ui/issues/22281
*/

const sizes:Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

const useStyles = makeStyles((theme) => {
  const styles:StyleRules = {};

  // Add a set of styles for each media breakpoint for each size
  sizes.forEach((size) => {
    // Media query based on user-defined custom breakpoints in theme
    const media = theme.breakpoints.up(size);

    // Add the styles for sizes 1-12
    for (let i = 1; i <= 12; i++) {
      const percentage = `${(i / 12) * 100}%`;

      styles[`${size}-${i}`] = {
        [media]: {
          flexGrow: 0,
          maxWidth: percentage,
          flexBasis: percentage,
        },
      };
    }

    // Add the "true" auto sizing style
    styles[`${size}-true`] = {
      [media]: {
        flexGrow: 1,
        maxWidth: '100%',
        flexBasis: 0,
      },
    };
  });

  return styles;
});

const Grid = forwardRef((props:GridProps, ref:React.ForwardedRef<HTMLDivElement>) => {
  const { item, className: propsClassName } = props;
  const classes = useStyles(props);
  let className = propsClassName;

  if (item) {
    sizes.forEach((size) => {
      const value = props[size];

      // Nothing to do if value is one of these
      if (value === undefined || value === null || value === false || value === "auto") return;

      let classKey;
      if (value === true) classKey = 'true';
      else classKey = value;

      // Add class name for this size
      className = classNames(className, classes[`${size}-${classKey}`]);
    });
  }

  return <MuiGrid ref={ref} {...props} className={className} />;
});

export default Grid;