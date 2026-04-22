import { Stack, Typography } from '@mui/material'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { useVolumeForModel } from 'actions/metrics'
import { useEffect, useEffectEvent, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { OverviewBaseMetrics } from 'types/types'

interface OverviewMetricsChartsProps {
  data: OverviewBaseMetrics
  organisationList: string[]
}

interface PieChartData {
  label: string
  value: number
}

export default function OverviewMetricsCharts({ data, organisationList }: OverviewMetricsChartsProps) {
  const [stateData, setStateData] = useState<PieChartData[]>([])
  const [schemaData, setSchemaData] = useState<PieChartData[]>([])
  const [structuredModelVolume, setStructuredModelVolume] = useState<any[]>([])

  const { modelVolume, isModelVolumeLoading, isModelVolumeError } = useVolumeForModel(
    [...organisationList],
    'month',
    '2025-04-17',
  )

  const updateStateData = useEffectEvent((newStateData) => {
    setStateData(newStateData)
  })

  useEffect(() => {
    if (data.modelState) {
      updateStateData(
        data.modelState.map((state) => {
          return {
            label: state.state,
            value: state.count,
          }
        }),
      )
    }
  }, [data.modelState])

  const updateSchemaData = useEffectEvent((newSchemaData) => {
    setSchemaData(newSchemaData)
  })

  useEffect(() => {
    if (data.schemaBreakdown) {
      updateSchemaData(
        data.schemaBreakdown.map((schemaItem) => {
          return {
            label: schemaItem.schemaName,
            value: schemaItem.count,
          }
        }),
      )
    }
  }, [data.schemaBreakdown])

  const updateModelVolume = useEffectEvent((modelVolume) => {
    const updatedStructure = modelVolume.map((volumeData) => {
      const incrementObject = {
        label: volumeData.increment,
      }
      volumeData.organisations.forEach((organisation) => {
        incrementObject[organisation.organisation] = organisation.count
      })
      return incrementObject
    })
    setStructuredModelVolume(updatedStructure)
  })

  useEffect(() => {
    if (modelVolume) {
      updateModelVolume(modelVolume)
    }
  }, [modelVolume])

  const pieChartSettings = {
    margin: { right: 5 },
    width: 200,
    height: 200,
  }

  const barChartConfig: Partial<BarChartProps> = {
    height: 350,
    margin: { left: 0 },
    yAxis: [{ width: 50 }],
    hideLegend: true,
  }

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  if (isModelVolumeError) {
    return <MessageAlert message={isModelVolumeError.info.message} severity='error' />
  }

  if (isModelVolumeLoading) {
    return <Loading />
  }

  return (
    <Stack spacing={4}>
      <BarChart
        dataset={structuredModelVolume}
        series={[
          ...organisationList.map((organisation) => {
            return { dataKey: organisation, label: organisation }
          }),
        ]}
        xAxis={[{ dataKey: 'label' }]}
        {...barChartConfig}
      />
      <Stack spacing={4} alignItems='center'>
        <Stack direction={{ md: 'row', sm: 'column' }} spacing={2}>
          <OverviewStatPanel label='Total models' value={data.models} />
          <OverviewStatPanel label='Models with releases' value={data.withReleases} />
          <OverviewStatPanel label='Models with access requests' value={data.withAccessRequest} />
        </Stack>
        <Stack spacing={2} direction='row'>
          <Stack spacing={2}>
            <Typography fontWeight='bold' variant='h6' color='primary'>
              State
            </Typography>
            <PieChart
              series={[{ innerRadius: 50, outerRadius: 100, data: stateData, arcLabel: 'value' }]}
              {...pieChartSettings}
            />
          </Stack>
          <Stack spacing={2}>
            <Typography fontWeight='bold' variant='h6' color='primary'>
              Model card schemas
            </Typography>
            <PieChart
              series={[{ innerRadius: 50, outerRadius: 100, data: schemaData, arcLabel: 'value' }]}
              {...pieChartSettings}
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
