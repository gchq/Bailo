import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry } from '@rjsf/utils'
import * as _ from 'lodash-es'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import MetricItem from 'src/MuiForms/MetricItem'
import { getMirroredState } from 'utils/formUtils'
import { isValidNumber } from 'utils/stringUtils'
import { v4 as uuidv4 } from 'uuid'

export interface MetricValue {
  name: string
  value: number | string
}

interface Id {
  id: string
}

export type MetricValueWithId = MetricValue & Id

interface MetricsProps {
  onChange: (newValue: MetricValue[]) => void
  value: MetricValue[]
  label: string
  registry?: Registry
  required?: boolean
  id: string
}

export default function Metrics({ onChange, value, label, registry, required, id }: MetricsProps) {
  const [metricsWithIds, setMetricsWithIds] = useState<MetricValueWithId[]>([])
  const theme = useTheme()

  const onSetMetricsWithIds = useEffectEvent((newMetrics: MetricValueWithId[]) => {
    setMetricsWithIds(newMetrics)
  })

  useEffect(() => {
    const updatedMetricsWithIds = value.map((metric) => ({
      ...metric,
      id: uuidv4(),
    }))
    onSetMetricsWithIds(updatedMetricsWithIds)
  }, [value])

  const handleChange = useCallback(
    (newValues: MetricValue[]) => {
      onChange(newValues)
    },
    [onChange],
  )

  const handleMetricItemOnChange = useCallback(
    (updatedMetricItem: MetricValueWithId) => {
      const updatedMetricArray = _.cloneDeep(metricsWithIds)
      const index = metricsWithIds.findIndex((metric) => metric.id === updatedMetricItem.id)
      updatedMetricArray[index] = updatedMetricItem
      onChange(
        updatedMetricArray.map((metric) => ({
          name: metric.name,
          value: isValidNumber(metric.value as string) ? parseInt(metric.value as string) : metric.value,
        })),
      )
    },
    [metricsWithIds, onChange],
  )

  const table = useCallback(
    (data: MetricValue[]) => {
      if (!data || data.length === 0) {
        return (
          <Typography
            sx={{
              fontStyle: 'italic',
              color: theme.palette.customTextInput.main,
            }}
            aria-label={`Label for ${label}`}
          >
            Unanswered
          </Typography>
        )
      }
      return (
        <TableContainer component={Paper}>
          <Table sx={{ width: 'fit-content' }} size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Metric name</TableCell>
                <TableCell align='right'>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((metric) => (
                <TableRow key={metric.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component='th' scope='row' sx={{ wordBreak: 'break-all', maxWidth: 'sm' }}>
                    {metric.name}
                  </TableCell>
                  <TableCell align='right'>{metric.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    },
    [label, theme.palette.customTextInput.main],
  )

  const handleDeleteItem = useCallback(
    (id: string) => {
      const updatedMetricArray = _.cloneDeep(metricsWithIds)
      onChange(updatedMetricArray.filter((metric) => metric.id !== id))
      return
    },
    [metricsWithIds, onChange],
  )

  const metricItems = useMemo(() => {
    return metricsWithIds.map((metric, index) => (
      <MetricItem key={index} metric={metric} onChange={handleMetricItemOnChange} onDelete={handleDeleteItem} />
    ))
  }, [handleDeleteItem, handleMetricItemOnChange, metricsWithIds])

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext)

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredState && table(mirroredState)}
      display={registry.formContext.mirroredModel && value}
      label={label}
      required={required}
      id={id}
      mirroredModel={registry.formContext.mirroredModel}
    >
      {registry.formContext && registry.formContext.editMode && (
        <Stack spacing={2} sx={{ width: 'fit-content' }}>
          <Stack spacing={2}>{metricItems}</Stack>
          <Button onClick={() => handleChange([...value, { name: '', value: 0 }])} aria-label='add metric button'>
            Add item
          </Button>
        </Stack>
      )}
      {registry.formContext && !registry.formContext.editMode && <>{table(value)}</>}
    </AdditionalInformation>
  )
}
