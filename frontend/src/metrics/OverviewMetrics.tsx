import { Container, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { SettingsCategory } from 'src/entry/settings/Settings'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'

const data = {
  global: {
    users: 100,
    models: 200,
    schemaBreakdown: [
      { schemaId: 'v1', schemaName: 'V1 Model Upload', count: 200 },
      { schemaId: 'v2', schemaName: 'V2 Model Upload', count: 5 },
    ],
    modelState: {
      live: 10,
      inDevelopment: 20,
      retired: 5,
      none: 30,
    },
    withReleases: 34,
    withAccessRequest: 32,
  },
  byOrganisation: [
    {
      organisation: 'Example Organisation',
      users: 30,
      models: 180,
      schemaBreakdown: [
        { schemaId: 'v1', schemaName: 'V1 Model Upload', count: 200 },
        { schemaId: 'v2', schemaName: 'V2 Model Upload', count: 5 },
      ],
      modelState: {
        live: 10,
        inDevelopment: 20,
        retired: 5,
        none: 30,
      },
      withReleases: 22,
      withAccessRequest: 21,
    },
  ],
}

export default function OverviewMetrics() {
  const router = useRouter()

  const { organisationFromRouter } = router.query

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [filteredDataset, setFilteredDataset] = useState(data.global)

  const setSelectedOrganisationEffectEvent = useEffectEvent((newOrganisation: string) => {
    setSelectedOrganisation(newOrganisation)
  })

  useEffect(() => {
    if (organisationFromRouter) {
      setSelectedOrganisationEffectEvent(organisationFromRouter as string)
      router.replace({
        query: { ...router.query, category: SettingsCategory.DETAILS },
      })
    }
  }, [organisationFromRouter, router])

  const setFilteredDatasetEffectEvent = useEffectEvent((data: any) => {
    setFilteredDataset(data)
  })

  useEffect(() => {
    if (selectedOrganisation === 'All') {
      setFilteredDatasetEffectEvent(data.global)
    } else {
      const dataSubset = data.byOrganisation.find((subset: any) => subset.organisation === selectedOrganisation)
      if (dataSubset) {
        setFilteredDatasetEffectEvent(dataSubset)
      } else {
        setFilteredDatasetEffectEvent(undefined)
      }
    }
  }, [selectedOrganisation])

  const handleOrganisationSelectOnChange = useCallback((event: SelectChangeEvent) => {
    setSelectedOrganisation(event.target.value)
  }, [])

  const listItems = useMemo(() => {
    return data.byOrganisation.map((organisationSubset) => (
      <MenuItem key={organisationSubset.organisation} value={organisationSubset.organisation}>
        {organisationSubset.organisation}
      </MenuItem>
    ))
  }, [])

  return (
    <Container maxWidth='xl'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        <Select
          sx={{ maxWidth: '300px' }}
          value={selectedOrganisation}
          onChange={(e) => handleOrganisationSelectOnChange(e)}
        >
          <MenuItem key='all' value='All'>
            All organisations
          </MenuItem>
          {listItems}
        </Select>
        <OverviewMetricsCharts
          data={filteredDataset}
          organisationList={data.byOrganisation.map((organisationSubset) => organisationSubset.organisation)}
        />
      </Stack>
    </Container>
  )
}
