import { Stack, Typography } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'
import OverviewStatPanel from 'pages/metrics/OverviewStatPanel'
import { useEffect, useEffectEvent, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'

interface OverviewMetricsChartsProps {
  data: any
}

export default function OverviewMetricsCharts({ data }: OverviewMetricsChartsProps) {
  const [stateData, setStateData] = useState<any[]>([])
  const [schemaData, setSchemaData] = useState<any[]>([])

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

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography fontWeight='bold' variant='h6' color='primary'>
          General overview
        </Typography>
        <Stack direction={{ md: 'row', sm: 'column' }} spacing={2}>
          <OverviewStatPanel label='Total models' value={data.models} />
          <OverviewStatPanel label='Models with releases' value={data.withReleases} />
          <OverviewStatPanel label='Models with access requests' value={data.withAccessRequest} />
        </Stack>
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
