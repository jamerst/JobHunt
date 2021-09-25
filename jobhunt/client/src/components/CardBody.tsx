import React, { FunctionComponent } from "react"
import { Box } from "@mui/material"

const CardBody: FunctionComponent = (props) => {
  return (
    <Box sx={{ p: {xs: 1, md: 3}}}>
      {props.children}
    </Box>
  );
}

export default CardBody;