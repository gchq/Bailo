import { Box, List, ListItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { PolicyBaseMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: PolicyBaseMetrics
}

export default function PolicyMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()
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

  const tableRows = useMemo(() => {
    return data.entries.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          <Link href={`/model/${row.entryId}?tab=settings&category=permissions`}>{row.entryId}</Link>
        </TableCell>
        <TableCell>
          {row.modelOwners.map((owner) => (
            <UserDisplay key={owner} dn={owner} />
          ))}
        </TableCell>
        <TableCell>
          <List dense>
            {row.missingRoles.map((missingRole) => (
              <ListItem key={missingRole.roleId} sx={{ pl: 0 }}>
                {missingRole.roleName}
              </ListItem>
            ))}
          </List>
        </TableCell>
      </TableRow>
    ))
  }, [data.entries])

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
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
          <Table sx={{ minWidth: 650 }} size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>Model Developer(s)</TableCell>
                <TableCell>Missing roles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </Box>
      </Stack>
    </Stack>
  )
}
