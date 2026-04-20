import { Stack, Typography } from '@mui/material'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { useVolumeForModel } from 'actions/metrics'
import { useEffect, useEffectEvent, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'

interface OverviewMetricsChartsProps {
  data: any
  organisationList: string[]
}

export default function OverviewMetricsCharts({ data, organisationList }: OverviewMetricsChartsProps) {
  const [stateData, setStateData] = useState<any[]>([])
  const [schemaData, setSchemaData] = useState<any[]>([])
  const [formattedTimelineData, setformattedTimelineData] = useState([])

  const { modelVolume, isModelVolumeLoading, isModelVolumeError } = useVolumeForModel(
    [...organisationList, 'unset'],
    'month',
    '2025-04-17',
  )

  function monthDiff(dateFrom: Date, dateTo: Date) {
    return dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear())
  }

  const updateTimelineData = useEffectEvent((newTimelineData) => {
    const currentDate = new Date()
    const startDate = new Date('2025-04-17')
    const structuredData: any = []
    for (let i = 0; i < monthDiff(startDate, currentDate); i++) {
      const monthlyResult = {
        month: i,
        ...Object.fromEntries(organisationList.map((organisation) => [organisation, 0])),
      }
      structuredData.push(monthlyResult)
    }
    // const currentStartMonth = new Date('2025-04-17')
    // for (let i = 0; i < modelVolume.length; i++) {
    //   modelVolume.forEach((dataPoint) => {
    //     structuredData[monthDiff(new Date(dataPoint.data.startDate), new Date())][dataPoint.data.organisation || ''] =
    //       dataPoint.data.count
    //   })
    // }
    setformattedTimelineData(newTimelineData)
  })

  useEffect(() => {
    if (modelVolume) {
      updateTimelineData(modelVolume)
    }
  }, [modelVolume])

  const updateStateData = useEffectEvent((newStateData) => {
    setStateData(newStateData)
  })

  useEffect(() => {
    if (data.modelState) {
      updateStateData([
        { label: 'In production', value: data.modelState.live },
        { label: 'In development', value: data.modelState.inDevelopment },
        { label: 'Not set', value: data.modelState.none },
      ])
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
      <BarChart dataset={formattedTimelineData} series={[]} xAxis={[{ dataKey: 'month' }]} {...barChartConfig} />
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
  )
}
