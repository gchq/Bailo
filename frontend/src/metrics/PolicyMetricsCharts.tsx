import { Box, List, ListItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetEntryRoles } from 'actions/entry'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import { SettingsCategory } from 'src/entry/settings/Settings'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import OverviewStatPanel from 'src/metrics/OverviewStatPanel'
import { PolicyBaseMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: PolicyBaseMetrics
}

export default function PolicyMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const ownerRoleDisplayName = useMemo(() => {
    if (entryRoles) {
      const displayName = entryRoles.find((role) => role.shortName === 'owner')
      return displayName ? displayName.name : 'Owner'
    }
  }, [entryRoles])

  const displayMissingRoleCounts = useMemo(() => {
    return data.summary.map((roleSummary) => {
      return (
        <OverviewStatPanel
          key={roleSummary.roleId}
          label={`entries missing ${roleSummary.roleId.toUpperCase()}`}
          value={roleSummary.count}
        />
      )
    })
  }, [data.summary])

  const tableRows = useMemo(() => {
    return data.entries.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          <Link href={`/model/${row.entryId}?tab=settings&category=${SettingsCategory.PERMISSIONS}`}>
            {row.entryId}
          </Link>
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

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} />
  }

  if (isEntryRolesLoading) {
    return <Loading />
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ md: 'row', sm: 'column' }} spacing={2}>
        {displayMissingRoleCounts}
      </Stack>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography fontWeight='bold' variant='h6' color='primary'>
          Entries missing review roles
        </Typography>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
          <Table sx={{ minWidth: 650 }} size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>{ownerRoleDisplayName}</TableCell>
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
