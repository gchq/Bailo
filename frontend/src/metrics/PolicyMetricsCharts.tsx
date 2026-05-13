import { Box, Grid, List, ListItem, Stack, Typography } from '@mui/material'
import { memoize } from 'lodash-es'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Paginate from 'src/common/Paginate'
import Link from 'src/Link'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { PolicyBaseMetrics, PolicyModelMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: PolicyBaseMetrics
}

export default function PolicyMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const displayMissingRoleCounts = useMemo(() => {
    return data.summary.map((roleSummary) => {
      return (
        <OverviewStatPanel
          key={roleSummary.roleId}
          label={`models missing ${roleSummary.roleId.toUpperCase()}`}
          value={roleSummary.count}
        />
      )
    })
  }, [data.summary])

  const EntryRow = memoize(({ data: entry }: { data: PolicyModelMetrics }) => {
    return (
      <Grid container alignItems='center'>
        <Grid size={{ sm: 6, xs: 12 }} sx={{ pl: 2 }}>
          <Box>
            <Link href={`/model/${entry.entryId}`}>{entry.entryId}</Link>
          </Box>
        </Grid>
        <Grid size={{ sm: 6, xs: 12 }}>
          <List dense>
            {entry.missingRoles.map((missingRole) => (
              <ListItem key={missingRole.roleId} sx={{ pl: 0 }}>
                {missingRole.roleName}
              </ListItem>
            ))}
          </List>{' '}
        </Grid>
      </Grid>
    )
  })

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ md: 'row', sm: 'column' }} spacing={2} sx={{ mt: 40 }}>
        {displayMissingRoleCounts}
      </Stack>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography fontWeight='bold' variant='h6' color='primary'>
          Models missing roles
        </Typography>
        <Paginate
          list={data.entries}
          emptyListText='No releases found'
          defaultSortProperty='entryId'
          searchFilterProperty='entryId'
          searchPlaceholderText='Search by ID'
          sortingProperties={[{ value: 'entryId', title: 'ID', iconKind: 'text' }]}
        >
          {EntryRow}
        </Paginate>
      </Stack>
    </Stack>
  )
}
