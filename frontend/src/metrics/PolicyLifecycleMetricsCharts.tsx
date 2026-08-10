import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Check from '@mui/icons-material/Check'
import Warning from '@mui/icons-material/Warning'
import {
  Box,
  Button,
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
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import OwnerRoleDisplay from 'src/metrics/components/OwnerRoleDisplay'
import { WeekFilterOptions, WeekFilterOptionsKeys } from 'src/metrics/PolicyMetrics'
import { EntryRole, GlobalLifecycleMetrics } from 'types/types'
import { formatDateStringAsDayMonthAndYear, isOverdue } from 'utils/dateUtils'

interface PolicyMetricsChartsProps {
  data: GlobalLifecycleMetrics
  weekFilter: WeekFilterOptionsKeys
  weekFilterOnChange: (newFilter: WeekFilterOptionsKeys) => void
  entryRoles: EntryRole[]
}

export default function PolicyLifecycleMetricsCharts({
  data,
  weekFilter,
  weekFilterOnChange,
  entryRoles,
}: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const tableTitle = useMemo(() => {
    switch (weekFilter) {
      case WeekFilterOptions.TWO_WEEKS:
        return 'Entries 2 weeks until their due date'
      case WeekFilterOptions.TEN_WEEKS:
        return 'Entries 10 weeks until their due date'
      case WeekFilterOptions.OVERDUE:
        return 'Entries past their due date'
      default:
        return 'Entries near or past lifecycle review date'
    }
  }, [weekFilter])

  const overDueWarning = (dueDate: string) => {
    if (isOverdue(dueDate)) {
      return (
        <Tooltip title='This lifecycle review is overdue'>
          <Warning color='warning' />
        </Tooltip>
      )
    }
  }

  const weekFilterMenuOptions = useCallback(() => {
    const options = [WeekFilterOptions.TWO_WEEKS, WeekFilterOptions.TEN_WEEKS, WeekFilterOptions.OVERDUE]
    return options.map((option) => (
      <MenuItem key={option} onClick={() => weekFilterOnChange(option)}>
        {weekFilter === option && (
          <ListItemIcon>
            <Check />
          </ListItemIcon>
        )}
        <ListItemText inset={weekFilter !== option}>
          {option !== WeekFilterOptions.OVERDUE ? `${option} weeks` : 'Overdue'}{' '}
        </ListItemText>
      </MenuItem>
    ))
  }, [weekFilter, weekFilterOnChange])

  const displayWeekFilters = useMemo(() => {
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
          Filter by missing role weeks until review is due
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
          {weekFilterMenuOptions()}
        </Menu>
      </Stack>
    )
  }, [anchorEl, open, weekFilterMenuOptions])

  const tableRows = useMemo(() => {
    return data.entries.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row' sx={{ wordBreak: 'break-word' }}>
          <Typography sx={{ maxWidth: '500px' }}>
            <Link href={`/model/${row.entryId}`}>{row.entryId}</Link>
          </Typography>
        </TableCell>
        <TableCell>
          <Stack spacing={1} sx={{ alignItems: 'center' }} direction='row'>
            <Typography>{formatDateStringAsDayMonthAndYear(row.dueDate)}</Typography>
            {overDueWarning(row.dueDate)}
          </Stack>
        </TableCell>
        <TableCell>
          {row.modelOwners && row.modelOwners.length > 0 ? (
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
    <Stack spacing={2}>
      <Stack spacing={2} sx={{ width: '100%' }}>
        {displayWeekFilters}
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          {tableTitle}
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
                <TableCell>Due date</TableCell>
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
