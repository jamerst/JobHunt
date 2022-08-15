import React, { PropsWithChildren } from "react"
import { Box } from "@mui/material"

const CardBody = ({ children }: PropsWithChildren) => {
  return (
    <Box sx={{ p: {xs: 1, md: 3}}}>
      {children}
    </Box>
  );
}

export default CardBody;