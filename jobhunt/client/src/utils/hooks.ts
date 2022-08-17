import { useTheme, Breakpoint, Theme } from "@mui/material/styles"
import React, { useEffect, useMemo, useState } from "react"
import { useSetRecoilState } from "recoil"
import { feedbackState } from "state"

export type ResponsiveValues<P> = Partial<Record<Breakpoint, P>>

export const useResponsive = () => {
  const theme = useTheme()

  const matches = useBreakpoints();

  return function <P>(responsiveValues: ResponsiveValues<P>) {
    let match: Breakpoint | undefined;
    theme.breakpoints.keys.forEach((breakpoint) => {
      if (matches[breakpoint] && responsiveValues[breakpoint] != null) {
        match = breakpoint;
      }
    })

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
      queries[b]!.addEventListener("change", listeners[b]!);
    });

    return () => {
      theme.breakpoints.keys.forEach(b => {
        queries[b]!.removeEventListener("change", listeners[b]!)
      })
    }
  }, [theme]);

  return matches;
}

const getQueries = (breakpoints: Breakpoint[], theme: Theme) => breakpoints.reduce((acc: Partial<Record<Breakpoint, MediaQueryList>>, b) =>
  ({
    ...acc,
    [b]: window.matchMedia(theme.breakpoints.up(b).replace(/^@media( ?)/m, ''))
  }),
  {}
);

const getMatches = (breakpoints: Breakpoint[], theme: Theme) => breakpoints.reduce((acc: Partial<Record<Breakpoint, boolean>>, b) =>
  ({
    ...acc,
    [b]: window.matchMedia(theme.breakpoints.up(b).replace(/^@media( ?)/m, '')).matches
  }),
  {}
);

export const useFeedback = () => {
  const setState = useSetRecoilState(feedbackState);

  const funcs = useMemo(() => ({
    showLoading: () => setState({ loading: true, success: false, error: false }),
    showSuccess: () => setState({ loading: false, success: true, error: false }),
    showError: () => setState({ loading: false, success: false, error: true }),
    clear: () => setState(s => ({ loading: false, success: s.success, error: false }))
  }), [setState]);

  return funcs;
}