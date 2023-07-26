import { Box, CircularProgress } from '@mui/material'
import { ReactElement } from 'react'

export default function Loading(): ReactElement {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  )
}
