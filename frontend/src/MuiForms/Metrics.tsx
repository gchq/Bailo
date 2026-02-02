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
import { getMirroredState, getState } from 'utils/formUtils'
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
  id: string
  registry?: Registry
  required?: boolean
}

export default function Metrics({ onChange, value, label, id, registry, required }: MetricsProps) {
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

  const metricsTableRows = (metrics) => {
    if (!metrics) {
      return undefined
    }
    return metrics.map((metric) => (
      <TableRow key={metric.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          {metric.name}
        </TableCell>
        <TableCell align='right'>{metric.value}</TableCell>
      </TableRow>
    ))
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext)
  const state = getState(id, registry.formContext)

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={metricsTableRows(mirroredState)}
      state={state}
      display={registry.formContext.mirroredModel && value.length > 0 && Object.keys(value[0]).length !== 0}
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
      {registry.formContext && !registry.formContext.editMode && (
        <>
          {!registry.formContext.mirroredModel && value.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          {value.length > 0 && (
            <TableContainer component={Paper}>
              <Table sx={{ maxWidth: 'sm' }} size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric name</TableCell>
                    <TableCell align='right'>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{metricsTableRows(value)}</TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </AdditionalInformation>
  )
}
