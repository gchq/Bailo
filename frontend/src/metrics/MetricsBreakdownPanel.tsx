import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useGetModelBreakdown } from 'actions/metrics'
import { type RefObject, useMemo } from 'react'
import MetricsBreakdownTable from 'src/metrics/MetricsBreakdownTable'
import { breakdownDefinitions, BreakdownQueryType } from 'src/metrics/metricsUtils'
import { SchemaInterface, SystemRole } from 'types/types'

/**
 * Takes the selected query parameters, fetches the data and renders it in the table,
 * where the query parameters are taken from which ever chart segment has been selected.
 */
function ModelBreakdown({
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
  const definition = breakdownDefinitions[queryType]

  const query = useMemo(
    () => definition.buildQuery(queryValue, { organisation, schemas }),
    [definition, queryValue, organisation, schemas],
  )

  const { entries, isEntriesLoading, isEntriesError } = useGetModelBreakdown(query)

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
    return <Typography color='error'>{definition.getErrorMessage(queryValue)}</Typography>
  }

  return <MetricsBreakdownTable title={definition.getTitle(queryValue)} data={tableData} isLoading={isEntriesLoading} />
}

/**
 * Displays the selected breakdown data in a table.
 */
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
        <ModelBreakdown schemas={schemas} organisation={organisation} queryType={queryType} queryValue={queryValue} />
      </Stack>
    </Paper>
  )
}
