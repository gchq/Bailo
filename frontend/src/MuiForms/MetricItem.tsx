import CloseIcon from '@mui/icons-material/Close'
import { IconButton, Stack, TextField, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import * as _ from 'lodash-es'
import { useCallback, useState } from 'react'
import { MetricValueWithId } from 'src/MuiForms/Metrics'
import { isValidNumber } from 'utils/stringUtils'

interface MetricItemProps {
  metric: MetricValueWithId
  onChange: (updatedMetric: MetricValueWithId) => void
  onDelete: (metricId: string) => void
}

export default function MetricItem({ metric, onChange, onDelete }: MetricItemProps) {
  const theme = useTheme()
  const [errorMessage, setErrorMessage] = useState('')

  const handleMetricValueOnChange = useCallback(
    (value: string) => {
      setErrorMessage('')
      if (!isValidNumber(value)) {
        setErrorMessage('Metric value must be a valid whole number')
      }
      onChange({ id: metric.id, name: metric.name, value })
    },
    [metric.id, metric.name, onChange],
  )

  return (
    <Stack>
      <Stack direction='row' spacing={1}>
        <TextField
          size='small'
          value={metric.name}
          onChange={(e) => onChange({ id: metric.id, name: e.target.value, value: metric.value })}
        />
        <TextField
          error={errorMessage.length > 0}
          helperText={errorMessage}
          size='small'
          value={metric.value}
          onChange={(e) => handleMetricValueOnChange(e.target.value)}
        />
        <Tooltip title='Remove item'>
          <IconButton>
            <CloseIcon sx={{ color: theme.palette.error.main }} onClick={() => onDelete(metric.id)} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
