import Typography from '@mui/material/Typography'
import makeStyles from '@mui/styles/makeStyles'
import { FieldProps } from '@rjsf/core'
import React from 'react'

const useStyles = makeStyles({
  root: {
    marginTop: 5,
  },
})

const DescriptionField = ({ description }: FieldProps) => {
  if (description) {
    const classes = useStyles()

    return (
      <Typography variant='subtitle2' className={classes.root}>
        {description}
      </Typography>
    )
  }

  return null
}

export default DescriptionField
