import Typography from '@mui/material/Typography'
import makeStyles from '@mui/styles/makeStyles'
import { FieldProps } from '@rjsf/core'
import React from 'react'

const useStyles = makeStyles({
  root: {
    marginTop: 5,
  },
})

function DescriptionField({ description }: FieldProps) {
  const classes = useStyles()

  if (description) {
    return (
      <Typography variant='subtitle2' className={classes.root}>
        {description}
      </Typography>
    )
  }

  return null
}

export default DescriptionField
