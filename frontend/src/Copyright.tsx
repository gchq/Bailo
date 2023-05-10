import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import React from 'react'

export default function Copyright(props: Record<string, unknown>) {
  return (
    <Typography variant='body2' color='text.secondary' align='center' {...props}>
      {'Copyright © '}
      <Link color='inherit' href='https://www.gchq.gov.uk/'>
        Crown Copyright
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  )
}
