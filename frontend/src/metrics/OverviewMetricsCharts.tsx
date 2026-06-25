import dayjs, { Dayjs } from '@dayjs'
import { Stack, Typography } from '@mui/material'
import { cheerfulFiestaPaletteDark, mangoFusionPaletteDark } from '@mui/x-charts'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { PieChart, pieClasses } from '@mui/x-charts/PieChart'
import { DatePicker } from '@mui/x-date-pickers'
import { useGetVolumeForModel } from 'actions/metrics'
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
    colors: cheerfulFiestaPaletteDark,
    borderRadius: 2,
  })

  const pieChartSettings = {
    margin: { right: 5 },
    width: 200,
    height: 200,
    sx: {
      [`& .${pieClasses.arcLabel}`]: {
        fontWeight: 'bold',
        color: 'white',
      },
    },
    colors: mangoFusionPaletteDark,
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
    setBarChartConfig((prev) => ({
      ...prev,
      hideLegend: changedOrganisation !== 'All',
    }))
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
    return <MessageAlert message={isModelVolumeError.info.message} severity='error' />
  }

  if (isModelVolumeLoading) {
    return <Loading />
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
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
            minDate={dayjs('1970/01/01')}
            maxDate={endDate || dayjs(new Date())}
          />
          <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
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
            minDate={startDate || dayjs('1970/01/01')}
            maxDate={dayjs(new Date())}
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
        <Stack
          spacing={6}
          sx={{ alignItems: { lg: 'flex-start', md: 'center' } }}
          direction={{ lg: 'row', md: 'column' }}
        >
          <Stack spacing={2}>
            <OverviewStatPanel label='total entries' value={data.entries} minWidth='300px' />
            <OverviewStatPanel label='entries with releases' value={data.withReleases} minWidth='300px' />
            <OverviewStatPanel label='entries with access requests' value={data.withAccessRequest} minWidth='320px' />
          </Stack>
          <Stack
            spacing={2}
            direction={{ lg: 'row', md: 'column' }}
            sx={{ width: '100%', justifyContent: 'space-around' }}
          >
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
                Life cycle status
              </Typography>
              <PieChart
                series={[
                  {
                    innerRadius: 50,
                    outerRadius: 100,
                    data: stateData,
                    arcLabel: 'value',
                    paddingAngle: 1,
                    cornerRadius: 4,
                    highlightScope: { fade: 'global', highlight: 'item' },
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: 'horizontal',
                    position: {
                      vertical: 'bottom',
                      horizontal: 'center',
                    },
                  },
                }}
                {...pieChartSettings}
              />
            </Stack>
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
                Schema usage
              </Typography>
              <PieChart
                series={[
                  {
                    innerRadius: 50,
                    outerRadius: 100,
                    data: schemaData,
                    arcLabel: 'value',
                    paddingAngle: 1,
                    cornerRadius: 4,
                    color: 'red',
                    highlightScope: { fade: 'global', highlight: 'item' },
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: 'horizontal',
                    position: {
                      vertical: 'bottom',
                      horizontal: 'center',
                    },
                  },
                }}
                {...pieChartSettings}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
