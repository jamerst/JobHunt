import React, { FunctionComponent } from "react"
import { Box } from "@material-ui/core"

const CardBody: FunctionComponent = (props) => (
  <Box p={3}>
    {props.children}
  </Box>
);

export default CardBody;