import React, { FunctionComponent } from "react"
import { Box } from "@material-ui/core"
import { useResponsive } from "../utils/hooks";

const CardBody: FunctionComponent = (props) => {
  const r = useResponsive();

  return (
    <Box p={r({xs: 1, md: 3})}>
      {props.children}
    </Box>
  );
}

export default CardBody;