import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FormContextType } from '@rjsf/utils'
import MetricItem from 'src/MuiForms/MetricItem'

export interface MetricValue {
  name: string
  value: number
}

interface MetricsProps {
  onChange: (newValue: MetricValue[]) => void
  value: MetricValue[]
  label: string
  formContext?: FormContextType
  required?: boolean
  rawErrors?: string[]
}

export default function TagSelector({ onChange, value, label, formContext, required, rawErrors }: MetricsProps) {
  const theme = useTheme()

  const handleChange = (_event: React.SyntheticEvent<Element, Event>, newValues: MetricValue[]) => {
    onChange(newValues)
  }

  return (
    <>
      {formContext && formContext.editMode && (
        <>
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          {value.map((metric) => (
            <Stack direction='row' spacing={1} key={`${metric.name}-${metric.value}`}>
              <TextField>{metric.name}</TextField>
              <TextField>{metric.value}</TextField>
            </Stack>
          ))}
        </>
      )}
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          {value.map((metric) => (
            <MetricItem key={`${metric.name}-${metric.value}`} metric={metric} />
          ))}
        </>
      )}
    </>
  )
}
