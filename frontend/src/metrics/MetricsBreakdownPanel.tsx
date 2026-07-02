import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useGetModelBreakdown } from 'actions/metrics'
import { type RefObject, useMemo } from 'react'
import MetricsBreakdownTable from 'src/metrics/MetricsBreakdownTable'
import { BreakdownQueryType } from 'src/metrics/metricsUtils'
import { SchemaInterface, SystemRole } from 'types/types'

function ModelsByStateBreakdown({
  selectedOrganisation,
  selectedState,
}: {
  selectedOrganisation: string
  selectedState: string
}) {
  const { entries, isEntriesLoading, isEntriesError } = useGetModelBreakdown({
    organisation: selectedOrganisation,
    state: selectedState,
  })

  const tableData = useMemo(
    () =>
      (entries ?? []).map((entry) => ({
        entryId: entry.entryId,
        entryName: entry.entryName,
        modelOwners:
          entry.collaborators
            ?.filter((person) => person.roles.includes(SystemRole.Owner))
            .map((person) => person.entity) ?? [],
      })),
    [entries],
  )

  if (isEntriesError) {
    return (
      <Typography color='error'>
        Failed to load models in state &ldquo;{selectedState}&rdquo;. Please try again.
      </Typography>
    )
  }

  const tableTitle =
    selectedState.toLowerCase() === 'none' ? `Models with no state selected` : `Models in state: ${selectedState}`

  return <MetricsBreakdownTable title={tableTitle} data={tableData ?? []} isLoading={isEntriesLoading} />
}

function ModelsBySchemaBreakdown({
  schemas,
  selectedOrganisation,
  selectedSchemaName,
}: {
  schemas: SchemaInterface[]
  selectedOrganisation: string
  selectedSchemaName: string
}) {
  const selectedSchemaId = schemas.find((schema) => schema.name === selectedSchemaName)?.id ?? 'none'
  const { entries, isEntriesLoading, isEntriesError } = useGetModelBreakdown({
    organisation: selectedOrganisation,
    schemaId: selectedSchemaId,
  })

  const tableData = useMemo(
    () =>
      (entries ?? []).map((entry) => ({
        entryId: entry.entryId,
        entryName: entry.entryName,
        modelOwners:
          entry.collaborators
            ?.filter((person) => person.roles.includes(SystemRole.Owner))
            .map((person) => person.entity) ?? [],
      })),
    [entries],
  )

  if (isEntriesError) {
    return (
      <Typography color='error'>
        Failed to load models in state &ldquo;{selectedSchemaName}&rdquo;. Please try again.
      </Typography>
    )
  }

  const tableTitle =
    selectedSchemaName.toLowerCase() === 'none'
      ? `Models with no schema selected`
      : `Models with schema: ${selectedSchemaName}`

  return <MetricsBreakdownTable title={tableTitle} data={tableData ?? []} isLoading={isEntriesLoading} />
}

function BreakdownContent({
  schemas,
  organisation,
  queryType,
  queryValue,
}: {
  schemas: SchemaInterface[]
  organisation: string
  queryType: BreakdownQueryType
  queryValue: string
}) {
  switch (queryType) {
    case 'byState':
      return <ModelsByStateBreakdown selectedOrganisation={organisation} selectedState={queryValue} />
    case 'bySchema':
      return (
        <ModelsBySchemaBreakdown
          schemas={schemas}
          selectedOrganisation={organisation}
          selectedSchemaName={queryValue}
        />
      )
    default:
      return null
  }
}

export default function MetricsBreakdownPanel({
  schemas,
  queryType,
  queryValue,
  organisation,
  onClose,
  panelRef,
}: {
  schemas: SchemaInterface[]
  queryType: BreakdownQueryType
  queryValue: string
  organisation: string
  onClose: () => void
  panelRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <Paper ref={panelRef} variant='outlined' sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Breakdown
          </Typography>
          <Tooltip title='Close breakdown'>
            <IconButton size='small' onClick={onClose} aria-label='close breakdown'>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
        <BreakdownContent schemas={schemas} organisation={organisation} queryType={queryType} queryValue={queryValue} />
      </Stack>
    </Paper>
  )
}
