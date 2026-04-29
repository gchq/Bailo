import { Box, List, ListItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Link from 'src/Link'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { PolicyBaseMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: PolicyBaseMetrics
}

export default function PolicyMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const tableRows = useMemo(() => {
    return data.models.map((row) => (
      <TableRow key={row.modelId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          <Link href={`/model/${row.modelId}`}>{row.modelId}</Link>
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
  }, [data.models])

  const displayMissingRoleCounts = useMemo(() => {
    return data.summary.map((roleSummary) => {
      return (
        <OverviewStatPanel
          key={roleSummary.roleId}
          label={`Total models missing ${roleSummary.roleId.toUpperCase()}`}
          value={roleSummary.count}
        />
      )
    })
  }, [data.summary])

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ md: 'row', sm: 'column' }} spacing={2}>
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
