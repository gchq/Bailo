import dayjs, { Dayjs } from '@dayjs'
import { Stack, Typography } from '@mui/material'
import { cheerfulFiestaPaletteDark } from '@mui/x-charts'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { DatePicker } from '@mui/x-date-pickers'
import { useGetVolumeForModel } from 'actions/metrics'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { noneColour, OverviewPieChart, PieChartData } from 'src/metrics/components/MetricsPieChart'
import OverviewStatPanel from 'src/metrics/components/OverviewStatPanel'
import { ModelVolume, ModelVolumeData, OverviewBaseMetrics } from 'types/types'
import { formatDateStringAsMonthAndYear, setAsFirstDayOfMonth, setAsLastDayOfMonth } from 'utils/dateUtils'
import { BreakdownQueryType } from 'utils/metricsUtils'

interface OverviewMetricsChartsProps {
  data: OverviewBaseMetrics
  organisationList: string[]
  selectedOrganisation: string
  onSelect: (type: BreakdownQueryType, value: string) => void
}

type BarChartRow = {
  label: string
} & Record<string, number | string>

export default function OverviewMetricsCharts({
  data,
  organisationList,
  selectedOrganisation,
  onSelect,
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
        color: state.state.toLowerCase() === 'none' ? noneColour : undefined,
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
            color: schemaItem.schemaName.toLowerCase() === 'none' ? noneColour : undefined,
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
        {/** TODO - Currently only the cards and pie charts are clickable.
         *          Once all charts in this page are clickable, move this text to above the top chart and update the text */}
        <Typography sx={{ mb: 2 }}>Click on any of the charts below to view the model breakdown</Typography>
        <Stack
          spacing={6}
          sx={{ alignItems: { lg: 'flex-start', md: 'center' } }}
          direction={{ lg: 'row', md: 'column' }}
        >
          <Stack spacing={2}>
            <OverviewStatPanel
              label='total entries'
              value={data.entries}
              onClick={() => onSelect('totalEntries', '')}
              minWidth='300px'
            />
            <OverviewStatPanel
              label='entries with releases'
              value={data.withReleases}
              onClick={() => onSelect('withReleases', '')}
              minWidth='300px'
            />
            <OverviewStatPanel
              label='entries with access requests'
              value={data.withAccessRequest}
              onClick={() => onSelect('withAccessRequest', '')}
              minWidth='320px'
            />
          </Stack>
          <Stack>
            <Stack
              spacing={2}
              direction={{ lg: 'row', md: 'column' }}
              sx={{ width: '100%', justifyContent: 'space-around' }}
            >
              <OverviewPieChart
                id='life-cycle-status'
                title='Life cycle status'
                data={stateData}
                onSelectItem={(label) => onSelect('byState', label)}
              />
              <OverviewPieChart
                id='schema-usage'
                title='Schema usage'
                data={schemaData}
                onSelectItem={(label) => onSelect('bySchema', label)}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
