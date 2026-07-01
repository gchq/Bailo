import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useListEntries } from 'actions/entry'
import { type RefObject, useMemo } from 'react'
import MetricsBreakdownTable from 'src/metrics/MetricsBreakdownTable'
import { BreakdownQueryType } from 'src/metrics/metricsUtils'
import { EntryKindKeys, SystemRole } from 'types/types'

function ModelsByStateBreakdown({ selectedState }: { selectedState: string }) {
  const { entries, isEntriesLoading, isEntriesError } = useListEntries(
    'model' as EntryKindKeys,
    [],
    '',
    [],
    [],
    [selectedState],
  )

  const tableData = useMemo(
    () =>
      entries.map((entry) => ({
        entryId: entry.id,
        entryName: entry.name,
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

  return (
    <MetricsBreakdownTable title={`Models in state: ${selectedState}`} data={tableData} isLoading={isEntriesLoading} />
  )
}

function ModelsBySchemaBreakdown({ selectedSchema }: { selectedSchema: string }) {
  return (
    <Typography color='text.secondary'>Schema breakdown for &ldquo;{selectedSchema}&rdquo; coming soon.</Typography>
  )
}

function BreakdownContent({ queryType, queryValue }: { queryType: BreakdownQueryType; queryValue: string }) {
  switch (queryType) {
    case 'byState':
      return <ModelsByStateBreakdown selectedState={queryValue} />
    case 'bySchema':
      return <ModelsBySchemaBreakdown selectedSchema={queryValue} />
    default:
      return null
  }
}

export default function MetricsBreakdownPanel({
  queryType,
  queryValue,
  onClose,
  panelRef,
}: {
  queryType: BreakdownQueryType
  queryValue: string
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
        <BreakdownContent queryType={queryType} queryValue={queryValue} />
      </Stack>
    </Paper>
  )
}
