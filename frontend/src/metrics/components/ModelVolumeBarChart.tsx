import dayjs, { type Dayjs } from '@dayjs'
import { Stack } from '@mui/material'
import { useGetVolumeForModel } from 'actions/metrics'
import { useMemo, useState } from 'react'
import { MonthlyUploadsSelector } from 'src/metrics/components/MonthlyUploadsSelector'
import { type ModelVolume } from 'types/types'
import { formatDateStringAsMonthAndYear, setAsFirstDayOfMonth, setAsLastDayOfMonth } from 'utils/dateUtils'
import { dateFormat, filterSelectTypes } from 'utils/metricsUtils'

import { ClickableBarChart } from './ClickableBarChart'

export type VolumeRow = { label: string; month: string } & Record<string, number | string>

function toVolumeChartRows(volume: ModelVolume | undefined, selectedOrganisation: string): VolumeRow[] {
  const showAll = selectedOrganisation === filterSelectTypes.ALL

  return (volume?.data ?? []).map(({ startDate, organisations }) => {
    const counts = Object.entries(organisations).filter(([org]) => showAll || org === selectedOrganisation)

    return {
      ...Object.fromEntries(counts),
      label: formatDateStringAsMonthAndYear(startDate),
      month: dayjs(startDate).format(dateFormat),
    }
  })
}

interface ModelVolumeChartProps {
  organisationList: string[]
  selectedOrganisation: string
  onSelectMonth: (month: string) => void
}

export function ModelVolumeBarChart({ organisationList, selectedOrganisation, onSelectMonth }: ModelVolumeChartProps) {
  const [startDate, setStartDate] = useState<Dayjs | null>(() => dayjs().subtract(1, 'year'))
  const [endDate, setEndDate] = useState<Dayjs | null>(() => dayjs())

  const { modelVolume } = useGetVolumeForModel(
    'month',
    `${setAsFirstDayOfMonth(startDate ?? dayjs())}`,
    `${setAsLastDayOfMonth(endDate ?? dayjs())}`,
  )

  const rows = useMemo(() => toVolumeChartRows(modelVolume, selectedOrganisation), [modelVolume, selectedOrganisation])

  const showingAll = selectedOrganisation === filterSelectTypes.ALL
  const series = (showingAll ? organisationList : [selectedOrganisation]).map((org) => ({ key: org, label: org }))

  return (
    <Stack spacing={2}>
      <MonthlyUploadsSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />
      <ClickableBarChart
        data={rows}
        categoryKey='label'
        series={series}
        hideLegend={!showingAll}
        onBarGroupClick={(row) => onSelectMonth(row.month)}
      />
    </Stack>
  )
}
