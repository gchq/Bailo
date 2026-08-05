import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Check from '@mui/icons-material/Check'
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
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import OwnerRoleDisplay from 'src/metrics/components/OwnerRoleDisplay'
import { WeekFilterOptions } from 'src/metrics/PolicyMetrics'
import { GlobalLifecycleMetrics } from 'types/types'
import { formatDateStringAsDayMonthAndYear } from 'utils/dateUtils'

interface PolicyMetricsChartsProps {
  data: GlobalLifecycleMetrics
  weekFilter: WeekFilterOptions
  weekFilterOnChange: (newFilter: WeekFilterOptions) => void
}

export default function PolicyLifecycleMetricsCharts({
  data,
  weekFilter,
  weekFilterOnChange,
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
          <MenuItem onClick={() => weekFilterOnChange(2)}>
            {weekFilter === 2 && (
              <ListItemIcon>
                <Check />
              </ListItemIcon>
            )}
            <ListItemText inset={weekFilter !== 2}>Two weeks</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => weekFilterOnChange(10)}>
            {weekFilter === 10 && (
              <ListItemIcon>
                <Check />
              </ListItemIcon>
            )}
            <ListItemText inset={weekFilter !== 10}>Ten weeks</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => weekFilterOnChange(0)}>
            {weekFilter === 0 && (
              <ListItemIcon>
                <Check />
              </ListItemIcon>
            )}
            <ListItemText inset={weekFilter !== 0}>Past due date</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
    )
  }, [anchorEl, open, weekFilter, weekFilterOnChange])

  const tableRows = useMemo(() => {
    return data.entries.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row' sx={{ wordBreak: 'break-word' }}>
          <Typography sx={{ maxWidth: '500px' }}>
            <Link href={`/model/${row.entryId}`}>{row.entryId}</Link>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography>{formatDateStringAsDayMonthAndYear(row.dueDate)}</Typography>
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
    <Stack spacing={2}>
      <Stack spacing={2} sx={{ width: '100%' }}>
        {displayWeekFilters}
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          Entries near or past lifecycle review date
        </Typography>
        <Box
          style={{
            backgroundColor: theme.palette.container.main,
            padding: 2,
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
