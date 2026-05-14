import { Stack, Typography } from '@mui/material'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { PieChart, pieClasses } from '@mui/x-charts/PieChart'
import { DatePicker } from '@mui/x-date-pickers'
import { useGetVolumeForModel } from 'actions/metrics'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { ModelVolume, ModelVolumeData, OverviewBaseMetrics } from 'types/types'
import { formatDateStringAsMonthAndYear, setAsFirstDayOfMonth, setAsLastDayOfMonth } from 'utils/dateUtils'

interface OverviewMetricsChartsProps {
  data: OverviewBaseMetrics
  organisationList: string[]
  selectedOrganisation: string
}

interface PieChartData {
  label: string
  value: number
}

type BarChartRow = {
  label: string
} & Record<string, number | string>

export default function OverviewMetricsCharts({
  data,
  organisationList,
  selectedOrganisation,
}: OverviewMetricsChartsProps) {
  const [schemaData, setSchemaData] = useState<PieChartData[]>([])
  const [structuredModelVolume, setStructuredModelVolume] = useState<BarChartRow[]>([])
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(new Date()))
  const [errorMessage, setErrorMessage] = useState('')
  const [barChartConfig, setBarChartConfig] = useState<Partial<BarChartProps>>({
    height: 250,
    margin: { left: 0 },
    yAxis: [{ width: 50 }],
  })

  const pieChartSettings = {
    margin: { right: 5 },
    width: 200,
    height: 200,
  }

  const { modelVolume, isModelVolumeLoading, isModelVolumeError } = useGetVolumeForModel(
    'month',
    `${startDate ? setAsFirstDayOfMonth(startDate) : setAsFirstDayOfMonth(dayjs(new Date()))}`,
    `${endDate ? setAsLastDayOfMonth(endDate) : setAsLastDayOfMonth(dayjs(new Date()))}`,
  )

  const stateData = useMemo(() => {
    return (
      data.entryState?.map((state) => ({
        label: state.state,
        value: state.count,
      })) ?? []
    )
  }, [data.entryState])

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

  const updateModelVolume = useEffectEvent((modelVolume: ModelVolume, changedOrganisation: string) => {
    if (changedOrganisation === 'All') {
      setBarChartConfig({ ...barChartConfig, hideLegend: false })
    } else {
      setBarChartConfig({ ...barChartConfig, hideLegend: true })
    }
    if (modelVolume.data) {
      const updatedStructure = modelVolume.data.map((volumeData: ModelVolumeData) => {
        const formattedDate = formatDateStringAsMonthAndYear(volumeData.startDate)
        const incrementObject = {
          label: formattedDate,
        }
        Object.entries(volumeData.organisations)
          .filter(([org]) => changedOrganisation === 'All' || org === changedOrganisation)
          .forEach(([org, count]) => {
            incrementObject[org] = count
          })
        return incrementObject
      })
      setStructuredModelVolume(updatedStructure)
    }
  })

  useEffect(() => {
    if (modelVolume) {
      updateModelVolume(modelVolume, selectedOrganisation)
    }
  }, [modelVolume, selectedOrganisation])

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
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} alignItems='center'>
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
            -
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
        <Stack spacing={6} alignItems='flex-start' direction={{ lg: 'row', md: 'column' }}>
          <Stack spacing={2}>
            <OverviewStatPanel label='Total entries' value={data.entries} minWidth='300px' />
            <OverviewStatPanel label='Entries with releases' value={data.withReleases} minWidth='300px' />
            <OverviewStatPanel label='Entries with access requests' value={data.withAccessRequest} minWidth='320px' />
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
                sx={{
                  [`.${pieClasses.series}[data-series="outer"] .${pieClasses.arc}`]: {
                    opacity: 0.6,
                  },
                }}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
