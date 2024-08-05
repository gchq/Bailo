import { Stack, TextField } from '@mui/material'
import { MetricValue } from 'src/MuiForms/Metrics'

interface MetricItemProps {
  metric: MetricValue
}

export default function MetricItem({ metric }: MetricItemProps) {
  return (
    <Stack direction='row' spacing={1}>
      <TextField>{metric.name}</TextField>
      <TextField>{metric.value}</TextField>
    </Stack>
  )
}
