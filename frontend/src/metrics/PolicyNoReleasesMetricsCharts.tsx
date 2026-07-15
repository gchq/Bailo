import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetEntryRoles } from 'actions/entry'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { GlobalNoReleasesMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: GlobalNoReleasesMetrics
}

export default function PolicyNoReleasesMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const ownerRoleDisplayName = useMemo(() => {
    if (entryRoles) {
      const displayName = entryRoles.find((role) => role.shortName === 'owner')
      return displayName ? displayName.name : 'Owner'
    }
  }, [entryRoles])

  const tableRows = useMemo(() => {
    return data.entries.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          <Typography sx={{ maxWidth: '500px' }}>
            <Link href={`/model/${row.entryId}`}>{row.entryId}</Link>
          </Typography>
        </TableCell>
        <TableCell>
          {row.modelOwners.length > 0 ? (
            row.modelOwners.map((owner) => <UserDisplay key={owner} dn={owner} />)
          ) : (
            <em>{`No ${ownerRoleDisplayName}s set`}</em>
          )}
        </TableCell>
      </TableRow>
    ))
  }, [data.entries, ownerRoleDisplayName])

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} />
  }

  if (isEntryRolesLoading) {
    return <Loading />
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
                <TableCell>{ownerRoleDisplayName}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </Box>
      </Stack>
    </Stack>
  )
}
