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
import { Registry, RJSFSchema } from '@rjsf/utils'
import * as _ from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import MetricItem from 'src/MuiForms/MetricItem'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'
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
  formContext?: Registry['formContext']
  id: string
  registry?: Registry
  required?: boolean
  schema: RJSFSchema
}

export default function Metrics({ onChange, value, label, id, registry, required, schema }: MetricsProps) {
  const [metricsWithIds, setMetricsWithIds] = useState<MetricValueWithId[]>([])

  useEffect(() => {
    setMetricsWithIds((current) =>
      value.map((metric, index) => ({
        ...metric,
        id: current[index]?.id ?? uuidv4(),
      })),
    )
  }, [value])

  const theme = useTheme()

  const handleAddItem = useCallback(() => {
    const newMetric: MetricValueWithId = {
      id: uuidv4(),
      name: '',
      value: 0,
    }

    const updatedMetrics = [...metricsWithIds, newMetric]

    setMetricsWithIds(updatedMetrics)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onChange(updatedMetrics.map(({ id, ...metric }) => metric))
  }, [metricsWithIds, onChange])

  const handleMetricItemOnChange = useCallback(
    (updatedMetricItem: MetricValueWithId) => {
      const updatedMetricArray = _.cloneDeep(metricsWithIds)
      const index = metricsWithIds.findIndex((metric) => metric.id === updatedMetricItem.id)
      updatedMetricArray[index] = updatedMetricItem
      setMetricsWithIds(updatedMetricArray)
      onChange(
        updatedMetricArray.map((metric) => ({
          name: metric.name,
          value: isValidNumber(metric.value as string) ? Number(metric.value as string) : metric.value,
        })),
      )
    },
    [metricsWithIds, onChange],
  )

  const handleDeleteItem = useCallback(
    (id: string) => {
      const updatedMetricArray = metricsWithIds.filter((metric) => metric.id !== id)

      setMetricsWithIds(updatedMetricArray)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onChange(updatedMetricArray.map(({ id, ...metric }) => metric))
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
  const compareFromState = getCompareFromState(id, registry.formContext) as MetricValue[] | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as MetricValue[] | undefined
  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  const metricsTableRows = (metrics: MetricValue[], compareWith?: MetricValue[]) => {
    if (!metrics) {
      return undefined
    }
    return _.zip(metrics, compareWith).map(([metric, compareWith]) => (
      <TableRow key={metric?.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell
          component='th'
          scope='row'
          sx={{
            wordBreak: 'break-word',
            maxWidth: '500px',
          }}
        >
          {inCompareMode ? <InlineDiff from={compareWith?.name} to={metric?.name} direction={'row'} /> : metric?.name}
        </TableCell>
        <TableCell align='right'>
          {inCompareMode ? (
            <InlineDiff from={compareWith?.value?.toString()} to={metric?.value?.toString()} direction={'row'} />
          ) : (
            metric?.value
          )}
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={metricsTableRows(mirroredState, compareFromMirroredState)}
      display={registry.formContext.mirroredModel && value !== undefined && value.length > 0}
      label={label}
      required={required}
      id={id}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      {registry.formContext && registry.formContext.editMode && (
        <Stack spacing={2} sx={{ width: 'fit-content' }}>
          <Stack spacing={2}>{metricItems}</Stack>
          <Button onClick={handleAddItem} aria-label='add metric button'>
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
              <Table sx={{ maxWidth: 'xs' }} size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric name</TableCell>
                    <TableCell align='right'>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{metricsTableRows(value, compareFromState)}</TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </AdditionalInformation>
  )
}
