import { Box, Stack, StackProps, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

interface LabelledInputProps {
  label: string
  htmlFor: string
  children: ReactNode
  required?: boolean
  fullWidth?: boolean
}

export default function LabelledInput({
  label,
  htmlFor,
  children,
  required = false,
  fullWidth = false,
}: LabelledInputProps) {
  const theme = useTheme()

  const stackProps: StackProps = fullWidth ? { sx: { width: '100%' } } : { sx: { alignItems: 'flex-start' } }

  return (
    <Stack {...stackProps}>
      <Typography
        component='label'
        htmlFor={htmlFor}
        sx={{
          fontWeight: 'bold',
        }}
      >
        {label}
        {required && (
          <Box
            component='span'
            style={{ color: theme.palette.primary.main }}
            sx={{
              ml: 0.5,
              color: theme.palette.primary.main,
            }}
          >
            *
          </Box>
        )}
      </Typography>
      {children}
    </Stack>
  )
}
