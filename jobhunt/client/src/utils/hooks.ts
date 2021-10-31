import { useTheme, Breakpoint, Theme } from "@mui/material/styles"
import useMediaQuery from "@mui/material/useMediaQuery"
import { breakpoints } from "@mui/system"
import { findLast } from "ramda"
import React, { useEffect, useState } from "react"

// type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl"

type ResponsiveValues<P> = {
  [key in Breakpoint]?: P
}

export const useResponsive = () => {
  const theme = useTheme()

  const matches = {
    xs: useMediaQuery(theme.breakpoints.up("xs")),
    sm: useMediaQuery(theme.breakpoints.up("sm")),
    md: useMediaQuery(theme.breakpoints.up("md")),
    lg: useMediaQuery(theme.breakpoints.up("lg")),
    xl: useMediaQuery(theme.breakpoints.up("xl")),
    xxl: useMediaQuery(theme.breakpoints.up("xxl")),
  }

  return function <P>(responsiveValues: ResponsiveValues<P>) {
    const match = findLast(
      (breakpoint) =>
        matches[breakpoint] && responsiveValues[breakpoint] != null,
      theme.breakpoints.keys
    )

    return match && responsiveValues[match]
  }
}

// eslint-disable-next-line react-hooks/exhaustive-deps
export const useMountEffect = (func: React.EffectCallback) => useEffect(func, []);

export const useBreakpoints = ():Partial<Record<Breakpoint, boolean>> => {
  const theme = useTheme();
  const [matches, setMatches] = useState<Partial<Record<Breakpoint, boolean>>>(getMatches(theme.breakpoints.keys, theme));

  useEffect(() => {
    const queries = getQueries(theme.breakpoints.keys, theme);
    let listeners: Partial<Record<Breakpoint, () => void>> = {};

    const updateMatch = (b: Breakpoint) => {
      setMatches((oldMatches) => ({...oldMatches, [b]: queries[b]?.matches ?? false }));
    }

    theme.breakpoints.keys.forEach(b => {
      listeners[b] = () => updateMatch(b);
      queries[b]?.addEventListener("change", listeners[b]!);
    });

    return () => {
      theme.breakpoints.keys.forEach(b => {
        queries[b]?.removeEventListener("change", listeners[b]!)
      })
    }
  }, [theme]);

  return matches;
}

const getQueries = (breakpoints: Breakpoint[], theme: Theme) => breakpoints.reduce((acc: Partial<Record<Breakpoint, MediaQueryList>>, b) => {
  acc[b] = window.matchMedia(theme.breakpoints.up(b).replace("@media ", ""));
  return acc;
}, {});

const getMatches = (breakpoints: Breakpoint[], theme: Theme) => breakpoints.reduce((acc: Partial<Record<Breakpoint, boolean>>, b) => {
  acc[b] = window.matchMedia(theme.breakpoints.up(b).replace("@media ", "")).matches;
  return acc;
}, {});