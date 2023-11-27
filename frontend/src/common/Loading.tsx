import { Box, CircularProgress } from '@mui/material'
import { ReactElement } from 'react'

type LoadingProps = {
  size?: number
}

export default function Loading({ size = 40 }: LoadingProps): ReactElement {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <CircularProgress color='primary' size={size} />
    </Box>
  )
}
