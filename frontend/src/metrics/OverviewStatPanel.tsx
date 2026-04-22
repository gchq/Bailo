import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface OverviewStatPanelProps {
  label: string
  value: number
}

export default function OverviewStatPanel({ label, value }: OverviewStatPanelProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        border: 'solid',
        borderWidth: 1,
        borderRadius: 3,
        borderColor: theme.palette.divider,
        p: 2,
        textAlign: 'center',
      }}
    >
      <Stack spacing={2}>
        <Typography fontWeight='bold' variant='h6'>
          {label}
        </Typography>
        <Divider flexItem />
        <Typography>{value}</Typography>
      </Stack>
    </Box>
  )
}
