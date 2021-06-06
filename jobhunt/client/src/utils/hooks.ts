import { useTheme } from "@material-ui/core/styles"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { findLast } from "ramda"

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl"

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


export default {}