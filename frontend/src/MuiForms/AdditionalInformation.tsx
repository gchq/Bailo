import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

interface AdditionalInformationProps {
  children: ReactNode
}

export default function AdditionalInformation({ children }: AdditionalInformationProps) {
  const theme = useTheme()

  if (children === undefined || (Array.isArray(children) && children.length === 0)) {
    return <></>
  }
  return (
    <Box sx={{ borderStyle: 'solid', borderWidth: 1, borderRadius: 1, borderColor: theme.palette.divider, p: 1, m: 2 }}>
      <Stack spacing={1}>
        <Typography variant='caption' fontWeight='bold'>
          Additional Information
        </Typography>
        <Typography>{children}</Typography>
      </Stack>
    </Box>
  )
}
