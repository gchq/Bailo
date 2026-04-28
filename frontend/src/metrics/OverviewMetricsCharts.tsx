import { Divider, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { DatePicker } from '@mui/x-date-pickers'
import { useGetVolumeForModel } from 'actions/metrics'
import dayjs, { Dayjs } from 'dayjs'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { ModelVolumeData, OverviewBaseMetrics } from 'types/types'

interface OverviewMetricsChartsProps {
  data: OverviewBaseMetrics
  organisationList: string[]
  selectedOrganisation: string
  onSelectedOrganisationChange: (value: string) => void
}

interface PieChartData {
  label: string
  value: number
}

export default function OverviewMetricsCharts({
  data,
  organisationList,
  selectedOrganisation,
  onSelectedOrganisationChange,
}: OverviewMetricsChartsProps) {
  const [stateData, setStateData] = useState<PieChartData[]>([])
  const [schemaData, setSchemaData] = useState<PieChartData[]>([])
  const [structuredModelVolume, setStructuredModelVolume] = useState<any[]>([])
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(new Date()))
  const [errorMessage, setErrorMessage] = useState('')

  const { modelVolume, isModelVolumeLoading, isModelVolumeError } = useGetVolumeForModel(
    'month',
    `${startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}`,
    `${endDate ? endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}`,
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

  const updateStartDate = useEffectEvent((newDate: Date) => {
    setStartDate(dayjs(newDate))
  })

  useEffect(() => {
    if (!startDate) {
      const updatedStartDate = new Date()
      updatedStartDate.setFullYear(updatedStartDate.getFullYear() - 1)
      updateStartDate(updatedStartDate)
    }
  }, [startDate])

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

  const listItems = useMemo(() => {
    return organisationList.map((organisation) => (
      <MenuItem key={organisation} value={organisation}>
        {organisation === 'unset' ? <em>No organisation</em> : organisation}
      </MenuItem>
    ))
  }, [organisationList])

  const handleOrganisationSelectOnChange = useCallback(
    (event: SelectChangeEvent) => {
      onSelectedOrganisationChange(event.target.value)
    },
    [onSelectedOrganisationChange],
  )

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  if (isModelVolumeError) {
    if (isModelVolumeError.status === 400 && !errorMessage) {
      setErrorMessage(isModelVolumeError.info.message)
    } else if (isModelVolumeError.status !== 400) {
      return <MessageAlert message={isModelVolumeError.info.message} severity='error' />
    }
  }

  if (isModelVolumeLoading) {
    return <Loading />
  }

  return (
    <Stack spacing={6} divider={<Divider flexItem />}>
      <Stack spacing={2}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Typography fontWeight='bold' variant='h6' color='primary'>
            Monthly uploads between
          </Typography>
          <DatePicker
            openTo='month'
            views={['year', 'month']}
            value={startDate}
            onChange={(newValue) => {
              setStartDate(newValue)
              setErrorMessage('')
            }}
          />
          <Typography fontWeight='bold' variant='h6' color='primary'>
            &
          </Typography>
          <DatePicker
            openTo='month'
            views={['year', 'month']}
            value={endDate}
            onChange={(newValue) => {
              setEndDate(newValue)
              setErrorMessage('')
            }}
          />
        </Stack>
        <Typography color='error'>{errorMessage}</Typography>
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
      </Stack>
      <Stack spacing={4}>
        <Stack direction='row' alignItems='center' spacing={2}>
          <Typography fontStyle='italic'>Showing results for</Typography>
          <Select
            sx={{ maxWidth: '300px' }}
            value={selectedOrganisation}
            onChange={(e) => handleOrganisationSelectOnChange(e)}
            variant='standard'
          >
            <MenuItem key='all' value='All'>
              All organisations
            </MenuItem>
            {listItems}
          </Select>
        </Stack>
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
