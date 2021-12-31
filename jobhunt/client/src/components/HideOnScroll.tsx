import React, { ReactElement } from "react"
import { Slide, useScrollTrigger } from "@mui/material"

type HideOnScrollProps = {
  children: ReactElement<any, any>
}

const HideOnScroll = (props: HideOnScrollProps) => {
  const trigger = useScrollTrigger({ threshold: 50 });

  return (
    <Slide appear={false} direction="up" in={!trigger}>{props.children}</Slide>
  )
}

export default HideOnScroll;