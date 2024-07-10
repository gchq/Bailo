import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

interface LabelledInputProps {
  label: string
  htmlFor: string
  children: ReactNode
  required?: boolean
}

export default function LabelledInput({ label, htmlFor, children, required = false }: LabelledInputProps) {
  const theme = useTheme()

  return (
    <Stack alignItems='flex-start'>
      <Typography component='label' fontWeight='bold' htmlFor={htmlFor}>
        {label}
        {required && (
          <Box
            component='span'
            ml={0.5}
            color={theme.palette.primary.main}
            style={{ color: theme.palette.primary.main }}
          >
            *
          </Box>
        )}
      </Typography>
      {children}
    </Stack>
  )
}
