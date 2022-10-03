import Typography from '@mui/material/Typography'
import { FieldProps } from '@rjsf/core'
import React from 'react'

function DescriptionField({ description }: FieldProps) {
  if (description) {
    return (
      <Typography variant='subtitle2' sx={{ mt: 5 }}>
        {description}
      </Typography>
    )
  }

  return null
}

export default DescriptionField
