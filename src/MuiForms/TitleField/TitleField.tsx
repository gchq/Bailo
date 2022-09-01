import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { FieldProps } from '@rjsf/core'
import React from 'react'

function TitleField({ title }: FieldProps) {
  return (
    <Box mb={1} mt={1}>
      <Typography variant='h5'>{title}</Typography>
      <Divider />
    </Box>
  )
}

export default TitleField
