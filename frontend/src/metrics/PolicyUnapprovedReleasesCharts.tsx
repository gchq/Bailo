import { Box, List, ListItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import OwnerRoleDisplay from 'src/metrics/components/OwnerRoleDisplay'
import { EntryRole, GlobalUnapprovedReleasesMetrics } from 'types/types'

interface PolicyUnapprovedReleasesMetricsProps {
  data: GlobalUnapprovedReleasesMetrics
  entryRoles: EntryRole[]
}

export default function PolicyUnapprovedReleasesCharts({ data, entryRoles }: PolicyUnapprovedReleasesMetricsProps) {
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
          <List dense>
            {row.unapprovedReleases.map((release) => (
              <ListItem key={release}>{release}</ListItem>
            ))}
          </List>
        </TableCell>
        <TableCell>
          {row.modelOwners.length > 0 ? (
            row.modelOwners.map((owner) => <UserDisplay key={owner} dn={owner} />)
          ) : (
            <em>
              No <OwnerRoleDisplay entryRoles={entryRoles} />s set
            </em>
          )}
        </TableCell>
      </TableRow>
    ))
  }, [data.entries, entryRoles])

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          Models with unapproved releases
        </Typography>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>Unapproved releases</TableCell>
                <TableCell>
                  <OwnerRoleDisplay entryRoles={entryRoles} />
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
