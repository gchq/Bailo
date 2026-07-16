import dayjs, { Dayjs } from '@dayjs'
import { Stack } from '@mui/material'
import { cheerfulFiestaPaletteDark } from '@mui/x-charts'
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart'
import { useGetVolumeForModel } from 'actions/metrics'
import { useEffect, useEffectEvent, useState } from 'react'
import { MonthlyUploadsSelector } from 'src/metrics/components/MonthlyUploadsSelector'
import { ModelVolume, ModelVolumeData } from 'types/types'
import { formatDateStringAsMonthAndYear, setAsFirstDayOfMonth, setAsLastDayOfMonth } from 'utils/dateUtils'
import { dateFormat, filterSelectTypes } from 'utils/metricsUtils'

type BarChartRow = {
  label: string
} & Record<string, number | string>

interface MetricsBarChartProps {
  organisationList: string[]
  selectedOrganisation: string
  onSelectMonth: (month: string) => void
}

export function MetricsBarChart({ organisationList, selectedOrganisation, onSelectMonth }: MetricsBarChartProps) {
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

  const { modelVolume } = useGetVolumeForModel(
    'month',
    `${startDate ? setAsFirstDayOfMonth(startDate) : setAsFirstDayOfMonth(dayjs(new Date()))}`,
    `${endDate ? setAsLastDayOfMonth(endDate) : setAsLastDayOfMonth(dayjs(new Date()))}`,
  )

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

  const updateModelVolume = useEffectEvent((modelVolume: ModelVolume, changedOrganisation: string) => {
    setBarChartConfig((prev) => ({
      ...prev,
      hideLegend: changedOrganisation !== filterSelectTypes.ALL,
    }))
    if (modelVolume.data) {
      const updatedStructure = modelVolume.data.map((volumeData: ModelVolumeData) => {
        const formattedDate = formatDateStringAsMonthAndYear(volumeData.startDate)

        const incrementObject = {
          label: formattedDate,
          month: dayjs(volumeData.startDate).format(dateFormat),
        }

        Object.entries(volumeData.organisations)
          .filter(([org]) => changedOrganisation === filterSelectTypes.ALL || org === changedOrganisation)
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

  return (
    <Stack spacing={2}>
      <MonthlyUploadsSelector
        startDate={startDate}
        endDate={endDate}
        errorMessage={errorMessage}
        onStartDateChange={(newValue) => {
          setStartDate(newValue)
          setErrorMessage('')
        }}
        onEndDateChange={(newValue) => {
          setEndDate(newValue)
          setErrorMessage('')
        }}
      />
      <BarChart
        dataset={structuredModelVolume}
        series={[
          ...organisationList.map((organisation) => ({
            dataKey: organisation,
            label: organisation,
          })),
        ]}
        xAxis={[{ dataKey: 'label' }]}
        axisHighlight={{ x: 'band' }}
        onAxisClick={(_, params) => {
          if (params?.dataIndex == null) {
            return
          }
          const row = structuredModelVolume[params.dataIndex]
          if (row?.month) {
            onSelectMonth(row.month as string)
          }
        }}
        sx={{
          cursor: 'pointer',
          '& .MuiBarElement-root': {
            transformBox: 'fill-box',
            transformOrigin: 'center bottom',
            transition: 'transform 0.15s, filter 0.15s',
          },
          '& .MuiChartsAxisHighlight-root': {
            fill: (theme) => theme.palette.action.hover,
            fillOpacity: 1,
          },
        }}
        {...barChartConfig}
      />
    </Stack>
  )
}
