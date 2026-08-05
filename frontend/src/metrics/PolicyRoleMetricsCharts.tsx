import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Check from '@mui/icons-material/Check'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import OwnerRoleDisplay from 'src/metrics/components/OwnerRoleDisplay'
import { PolicyRoleBaseMetrics } from 'types/types'

interface PolicyMetricsChartsProps {
  data: PolicyRoleBaseMetrics
}

export default function PolicyRoleMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const [missingRoleFilters, setMissingRolesFilters] = useState<string[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

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
    return (
      <Stack direction='row' spacing={1}>
        <Button
          id='menu-button'
          aria-label='filter-menu-button'
          onClick={handleClick}
          sx={{ width: 'fit-content' }}
          variant='outlined'
          size='small'
          endIcon={<ArrowDropDown />}
        >
          Filter by missing role {missingRoleFilters.length > 0 ? `(${missingRoleFilters.length})` : ''}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          slotProps={{
            list: {
              'aria-labelledby': 'menu-button',
            },
          }}
        >
          {data.summary.map((roleSummary) => (
            <MenuItem key={roleSummary.roleId} onClick={() => handleChipFilterOnClick(roleSummary.roleId)}>
              {missingRoleFilters.includes(roleSummary.roleId) && (
                <ListItemIcon>
                  <Check />
                </ListItemIcon>
              )}
              <ListItemText
                inset={!missingRoleFilters.includes(roleSummary.roleId)}
              >{`${roleSummary.roleName} (${roleSummary.count})`}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
        <Button disabled={missingRoleFilters.length === 0} onClick={() => setMissingRolesFilters([])}>
          Clear filters
        </Button>
      </Stack>
    )
  }, [anchorEl, data.summary, handleChipFilterOnClick, missingRoleFilters, open])

  const tableRows = useMemo(() => {
    return data.entries
      .filter(
        (row) =>
          missingRoleFilters.length === 0 || row.missingRoles.some((role) => missingRoleFilters.includes(role.roleId)),
      )
      .map((row) => (
        <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell component='th' scope='row' sx={{ wordBreak: 'break-word' }}>
            <Typography sx={{ maxWidth: '500px' }}>
              <Link href={`/model/${row.entryId}`}>{row.entryId}</Link>
            </Typography>
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
          <TableCell>
            {row.modelOwners.length > 0 ? (
              row.modelOwners.map((owner) => <UserDisplay key={owner} dn={owner} />)
            ) : (
              <em>
                No <OwnerRoleDisplay />s set
              </em>
            )}
          </TableCell>
        </TableRow>
      ))
  }, [data.entries, missingRoleFilters])

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  return (
    <Stack spacing={2}>
      {displayMissingRoleCountChips}
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          Entries missing review roles
        </Typography>
        <Box
          sx={{
            backgroundColor: theme.palette.container.main,
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
          }}
        >
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>Missing roles</TableCell>
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
