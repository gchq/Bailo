import { Container, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material'
import { useGetPolicyMetrics } from 'actions/metrics'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import { SettingsCategory } from 'src/entry/settings/Settings'
import MessageAlert from 'src/MessageAlert'
import PolicyMetricsCharts from 'src/metrics/PolicyMetricsCharts'
import { PolicyBaseMetrics } from 'types/types'

export default function PolicyMetrics() {
  const router = useRouter()

  const { organisationFromRouter } = router.query

  const { policyMetrics, isPolicyMetricsLoading, isPolicyMetricsError } = useGetPolicyMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [filteredDataset, setFilteredDataset] = useState<PolicyBaseMetrics | undefined>(undefined)

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
    if (!policyMetrics) {
      return
    }
    if (selectedOrganisation === 'All') {
      setFilteredDatasetEffectEvent(policyMetrics.global)
    } else {
      const dataSubset = policyMetrics.byOrganisation.find(
        (subset: any) => subset.organisation === selectedOrganisation,
      )
      if (dataSubset) {
        setFilteredDatasetEffectEvent(dataSubset)
      } else {
        setFilteredDatasetEffectEvent(undefined)
      }
    }
  }, [policyMetrics, selectedOrganisation])

  const handleOrganisationSelectOnChange = useCallback((event: SelectChangeEvent) => {
    setSelectedOrganisation(event.target.value)
  }, [])

  const listItems = useMemo(() => {
    if (!policyMetrics) {
      return []
    }
    return policyMetrics.byOrganisation.map((organisationSubset) => (
      <MenuItem key={organisationSubset.organisation} value={organisationSubset.organisation}>
        {organisationSubset.organisation === 'unset' ? <em>No organisation</em> : organisationSubset.organisation}
      </MenuItem>
    ))
  }, [policyMetrics])

  if (isPolicyMetricsError) {
    return <MessageAlert message={isPolicyMetricsError.info.message} />
  }

  if (isPolicyMetricsLoading) {
    return <Loading />
  }

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
        {filteredDataset && <PolicyMetricsCharts data={filteredDataset} />}
      </Stack>
    </Container>
  )
}
