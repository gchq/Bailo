import { Divider, Stack, Typography } from '@mui/material'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { useVolumeForModel } from 'actions/metrics'
import { useEffect, useEffectEvent, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { ModelVolumeData, OverviewBaseMetrics } from 'types/types'

interface OverviewMetricsChartsProps {
  data: OverviewBaseMetrics
  organisationList: string[]
  selectedOrganisation: string
}

interface PieChartData {
  label: string
  value: number
}

export default function OverviewMetricsCharts({
  data,
  organisationList,
  selectedOrganisation,
}: OverviewMetricsChartsProps) {
  const [stateData, setStateData] = useState<PieChartData[]>([])
  const [schemaData, setSchemaData] = useState<PieChartData[]>([])
  const [structuredModelVolume, setStructuredModelVolume] = useState<any[]>([])

  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)
  const endDate = new Date()

  const { modelVolume, isModelVolumeLoading, isModelVolumeError } = useVolumeForModel(
    'month',
    `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`,
    `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`,
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
    if (modelVolume && modelVolume.data) {
      const updatedStructure = modelVolume.data.map((volumeData: ModelVolumeData) => {
        const incrementObject = {
          label: volumeData.startDate.split('T')[0],
        }
        for (const organisationKey of Object.keys(volumeData.organisations)) {
          incrementObject[organisationKey] = volumeData.organisations[organisationKey]
        }
        return incrementObject
      })
      setStructuredModelVolume(updatedStructure)
    }
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
    height: 250,
    margin: { left: 0 },
    yAxis: [{ width: 50 }],
    hideLegend: true,
  }

  const displaySelectedOrganisation = () => {
    switch (selectedOrganisation) {
      case 'All':
        return (
          <Typography fontStyle='italic'>
            Showing results for the last 12 months for
            <span style={{ fontWeight: 'bold' }}> all organisations</span>
          </Typography>
        )
      case 'unset':
        return (
          <Typography fontStyle='italic'>
            Showing results for the last 12 months for
            <span style={{ fontWeight: 'bold' }}> models with no organisation set</span>
          </Typography>
        )
      default:
        return (
          <Typography fontStyle='italic'>
            Showing results for the last 12 months for
            <span style={{ fontWeight: 'bold' }}> {selectedOrganisation}</span>
          </Typography>
        )
    }
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
    <Stack spacing={6} divider={<Divider flexItem />}>
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
      <Stack spacing={4}>
        {displaySelectedOrganisation()}
        <Stack spacing={6} alignItems='center' direction={{ lg: 'row', md: 'column' }}>
          <Stack spacing={2}>
            <OverviewStatPanel label='Total models' value={data.models} minWidth='300px' />
            <OverviewStatPanel label='Models with releases' value={data.withReleases} minWidth='300px' />
            <OverviewStatPanel label='Models with access requests' value={data.withAccessRequest} minWidth='320px' />
          </Stack>
          <Stack
            spacing={2}
            direction={{ lg: 'row', md: 'column' }}
            justifyContent='space-around'
            sx={{ width: '100%' }}
          >
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
                Model card schemas usage
              </Typography>
              <PieChart
                series={[{ innerRadius: 50, outerRadius: 100, data: schemaData, arcLabel: 'value' }]}
                {...pieChartSettings}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
