import { Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

interface LabelledValueProps {
  label: string
  children: ReactNode
  action?: ReactNode
}

/** Displays a value beneath a bold label, with an optional action (e.g. an edit button) beside the label. */
export default function LabelledValue({ label, children, action }: LabelledValueProps) {
  const theme = useTheme()

  return (
    <Stack sx={{ width: '100%' }}>
      <Stack
        direction='row'
        spacing={1}
        sx={{
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          }}
        >
          {label}
        </Typography>
        {action}
      </Stack>
      {children}
    </Stack>
  )
}
