import { Container, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import PolicyMetricsCharts from 'pages/metrics/PolicyMetricsCharts'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { SettingsCategory } from 'src/entry/settings/Settings'

const data = {
  global: {
    summary: [
      { role: 'msro', count: 2 },
      { role: 'mtr', count: 1 },
      { role: 'owner', count: 0 },
    ],
    models: [
      {
        modelId: 'model-1',
        name: 'Model 1',
        missingRoles: ['msro', 'mtr'],
      },
      {
        modelId: 'model-2',
        name: 'Model 2',
        missingRoles: ['msro'],
      },
    ],
  },
  byOrganisation: [
    {
      organisation: 'west',
      summary: [
        { role: 'msro', count: 2 },
        { role: 'mtr', count: 1 },
        { role: 'owner', count: 0 },
      ],
      models: [
        {
          modelId: 'model-1',
          name: 'Model 1',
          missingRoles: ['msro', 'mtr'],
        },
        {
          modelId: 'model-2',
          name: 'Model 2',
          missingRoles: ['msro'],
        },
      ],
    },
  ],
}

export default function PolicyMetrics() {
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
        <PolicyMetricsCharts data={filteredDataset} />
      </Stack>
    </Container>
  )
}
