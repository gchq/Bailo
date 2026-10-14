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
import DiffMark from 'src/common/InlineDiff/DiffMark'
import InlineTypographyDiff from 'src/common/InlineDiff/InlineTypographyDiff'
import { alignKeyedRows } from 'src/common/InlineDiff/rowAlignment'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import MetricItem from 'src/MuiForms/MetricItem'
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

type MetricPair = { from?: MetricValue; to?: MetricValue }

const normaliseMetricValue = (value: number | string | undefined) => String(value ?? '').toLowerCase()

function alignMetrics(from: MetricValue[], to: MetricValue[]): MetricPair[] {
  return alignKeyedRows(
    from.map((metric) => normaliseMetricValue(metric.name)),
    to.map((metric) => normaliseMetricValue(metric.name)),
    (fromIndex, toIndex) => normaliseMetricValue(from[fromIndex].value) === normaliseMetricValue(to[toIndex].value),
  ).map(({ from: fromIndex, to: toIndex }) => ({
    from: fromIndex === undefined ? undefined : from[fromIndex],
    to: toIndex === undefined ? undefined : to[toIndex],
  }))
}

interface MetricsProps {
  onChange: (newValue: MetricValue[]) => void
  value: MetricValue[]
  label: string
  id: string
  registry?: Registry
  required?: boolean
  schema: RJSFSchema
}

type MetricCellDiffProps = {
  pair: MetricPair
  getText: (metric: MetricValue) => string
}

function MetricCellDiff({ pair, getText }: MetricCellDiffProps) {
  if (pair.from && pair.to) {
    return <InlineTypographyDiff from={getText(pair.from)} to={getText(pair.to)} />
  }

  const metric = pair.to ?? pair.from

  return (
    <DiffMark operation={pair.to ? 'insert' : 'delete'}>
      <Typography component='span'>{metric ? getText(metric) : ''}</Typography>
    </DiffMark>
  )
}

const getMetricName = (metric: MetricValue) => metric.name
const getMetricValue = (metric: MetricValue) => metric.value.toString()

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

  const compare = getCompareFieldState<MetricValue[]>(id, registry.formContext)

  const metricsTableRows = (metrics?: MetricValue[], compareWith?: MetricValue[]) => {
    if (!metrics && !compareWith) {
      return undefined
    }

    // Outside compare mode every row is a plain metric, so there is nothing to pair
    const pairs: MetricPair[] = compare.inCompareMode
      ? alignMetrics(compareWith ?? [], metrics ?? [])
      : (metrics ?? []).map((metric) => ({ to: metric }))

    return pairs.map((pair, index) => (
      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell
          component='th'
          scope='row'
          sx={{
            wordBreak: 'break-word',
            maxWidth: '500px',
          }}
        >
          {compare.inCompareMode ? <MetricCellDiff pair={pair} getText={getMetricName} /> : pair.to?.name}
        </TableCell>
        <TableCell align='right'>
          {compare.inCompareMode ? <MetricCellDiff pair={pair} getText={getMetricValue} /> : pair.to?.value}
        </TableCell>
      </TableRow>
    ))
  }

  // In compare mode the table is also shown when only the older version has metrics, so removals are visible
  const compareFromMetrics = compare.inCompareMode ? (compare.compareFromState ?? []) : []
  const showTable = value.length > 0 || compareFromMetrics.length > 0

  return (
    <AdditionalInformation
      editMode={compare.editMode}
      mirroredState={metricsTableRows(compare.mirroredState as MetricValue[], compare.compareFromMirroredState)}
      display={compare.isMirroredModel && value !== undefined && value.length > 0}
      label={label}
      required={required}
      id={id}
      mirroredModel={compare.isMirroredModel}
      description={schema.description}
    >
      {compare.editMode && (
        <Stack spacing={2} sx={{ width: 'fit-content' }}>
          <Stack spacing={2}>{metricItems}</Stack>
          <Button onClick={handleAddItem} aria-label='add metric button'>
            Add item
          </Button>
        </Stack>
      )}
      {!compare.editMode && (
        <>
          {!compare.isMirroredModel && !showTable && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          {showTable && (
            <TableContainer component={Paper}>
              <Table sx={{ maxWidth: 'xs' }} size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric name</TableCell>
                    <TableCell align='right'>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{metricsTableRows(value, compare.compareFromState)}</TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </AdditionalInformation>
  )
}
