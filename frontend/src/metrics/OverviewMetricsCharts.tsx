import { Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import { MetricsBarChart } from 'src/metrics/components/MetricsBarChart'
import { noneColour, OverviewPieChart } from 'src/metrics/components/MetricsPieChart'
import OverviewStatPanel from 'src/metrics/components/OverviewStatPanel'
import { OverviewBaseMetrics } from 'types/types'
import { BreakdownQueryType, toPieData } from 'utils/metricsUtils'

interface OverviewMetricsChartsProps {
  data: OverviewBaseMetrics
  organisationList: string[]
  selectedOrganisation: string
  onSelect: (type: BreakdownQueryType, value: string) => void
  onSelectMonth: (month: string) => void
}

export default function OverviewMetricsCharts({
  data,
  organisationList,
  selectedOrganisation,
  onSelect,
  onSelectMonth,
}: OverviewMetricsChartsProps) {
  const stateData = useMemo(
    () =>
      toPieData(
        (data.entryState ?? []).map((state) => ({
          label: state.state,
          value: state.count,
        })),
        noneColour,
      ),
    [data.entryState],
  )

  const schemaData = useMemo(
    () =>
      toPieData(
        (data.schemaBreakdown ?? []).map((schema) => ({
          label: schema.schemaName,
          value: schema.count,
        })),
        noneColour,
      ),
    [data.schemaBreakdown],
  )

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={4}>
      <Typography sx={{ mb: 2 }}>Click on any of the charts below to view the model breakdown</Typography>
      <Stack spacing={2}>
        <MetricsBarChart
          organisationList={organisationList}
          selectedOrganisation={selectedOrganisation}
          onSelectMonth={onSelectMonth}
        />
      </Stack>
      <Stack spacing={4}>
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
              sx={{
                width: '100%',
                justifyContent: 'space-around',
                alignItems: 'flex-start',
              }}
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
