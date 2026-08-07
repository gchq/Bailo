import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import OwnerRoleDisplay from 'src/metrics/components/OwnerRoleDisplay'
import { GlobalNoReleasesMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: GlobalNoReleasesMetrics
}

export default function PolicyNoReleasesMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const tableRows = useMemo(() => {
    return data.entries.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row' sx={{ wordBreak: 'break-word' }}>
          <Typography sx={{ maxWidth: '500px' }}>
            <Link href={`/model/${row.entryId}`}>{row.entryId}</Link>
          </Typography>
        </TableCell>
        <TableCell>
          {row.modelOwners && row.modelOwners.length > 0 ? (
            row.modelOwners.map((owner) => <UserDisplay key={owner} dn={owner} />)
          ) : (
            <em>
              No <OwnerRoleDisplay />s set
            </em>
          )}
        </TableCell>
      </TableRow>
    ))
  }, [data.entries])

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          Models with no releases
        </Typography>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>
                  <OwnerRoleDisplay />
                  (s)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </Box>
      </Stack>
    </Stack>
  )
}
