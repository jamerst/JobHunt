import { useTheme } from "@mui/material/styles"
import useMediaQuery from "@mui/material/useMediaQuery"
import { findLast } from "ramda"

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl"

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