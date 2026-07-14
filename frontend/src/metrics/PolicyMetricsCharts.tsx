import {
  Box,
  Chip,
  List,
  ListItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetEntryRoles } from 'actions/entry'
import { useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { PolicyBaseMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: PolicyBaseMetrics
}

export default function PolicyMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const [missingRoleFilters, setMissingRolesFilters] = useState<string[]>([])

  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const ownerRoleDisplayName = useMemo(() => {
    if (entryRoles) {
      const displayName = entryRoles.find((role) => role.shortName === 'owner')
      return displayName ? displayName.name : 'Owner'
    }
  }, [entryRoles])

  const handleChipFilterOnClick = useCallback(
    (roleId: string) => {
      if (!missingRoleFilters.includes(roleId)) {
        setMissingRolesFilters([...missingRoleFilters, roleId])
      } else {
        setMissingRolesFilters(missingRoleFilters.filter((roleFilter) => roleFilter !== roleId))
      }
    },
    [missingRoleFilters],
  )

  const displayMissingRoleCountChips = useMemo(() => {
    return data.summary.map((roleSummary) => {
      return (
        <Chip
          key={roleSummary.roleId}
          label={`${roleSummary.count} entries missing ${roleSummary.roleName}`}
          variant={missingRoleFilters.includes(roleSummary.roleId) ? 'filled' : 'outlined'}
          onClick={() => handleChipFilterOnClick(roleSummary.roleId)}
          color='primary'
        />
      )
    })
  }, [data.summary, handleChipFilterOnClick, missingRoleFilters])

  const tableRows = useMemo(() => {
    return data.entries
      .filter(
        (row) =>
          missingRoleFilters.length === 0 || row.missingRoles.some((role) => missingRoleFilters.includes(role.roleId)),
      )
      .map((row) => (
        <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell component='th' scope='row'>
            <Typography sx={{ maxWidth: '500px' }}>
              <Link href={`/model/${row.entryId}`}>{row.entryId}</Link>
            </Typography>
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
  }, [data.entries, missingRoleFilters])

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
        {displayMissingRoleCountChips}
      </Stack>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
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
