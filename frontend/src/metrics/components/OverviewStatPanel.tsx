import { Card, CardActionArea, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface OverviewStatPanelProps {
  label: string
  value: number
  onClick: () => void
  minWidth?: string
}

export default function OverviewStatPanel({ label, value, onClick, minWidth }: OverviewStatPanelProps) {
  const theme = useTheme()
  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 3,
        minWidth,
        transition: 'all 0.2s ease-in-out',

        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: theme.shadows[2],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          p: 2,
          textAlign: 'center',
        }}
      >
        <Stack spacing={2}>
          <Typography variant='h5' sx={{ fontWeight: 'bold' }} color='primary'>
            {value}
          </Typography>
          <Typography variant='h6'>{label}</Typography>
        </Stack>
      </CardActionArea>
    </Card>
  )
}
