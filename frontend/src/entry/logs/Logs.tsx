import {
  Box,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useGetUiConfig } from 'actions/uiConfig'
import { Dayjs } from 'dayjs'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind, EntryLogKind } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'
import { hasRole } from 'utils/roles'
import { toSentenceCase } from 'utils/stringUtils'

type LogsProps = {
  entry: EntryInterface
  currentUserRoles: string[]
}

export default function Logs({ entry, currentUserRoles }: LogsProps) {
  const router = useRouter()
  const theme = useTheme()

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [tableFilter, setTableFilter] = useState('')
  const [includeEntryFilter, setIncludeEntryFilter] = useState(true)
  const [includeFormFilter, setIncludeFormFilter] = useState(true)
  const [includeReleasesFilter, setIncludeReleasesFilter] = useState(true)
  const [includeAccessesFilter, setIncludeAccessesFilter] = useState(true)
  const [includeReviewsFilter, setIncludeReviewsFilter] = useState(true)
  const [startDateFilter, setStartDateFilter] = useState<Dayjs | null>(null)
  const [endDateFilter, setEndDateFilter] = useState<Dayjs | null>(null)

  useEffect(() => {
    const validRoles = ['owner']
    if (!hasRole(currentUserRoles, validRoles)) {
      const { category: _category, ...filteredQuery } = router.query
      router.replace({
        query: { ...filteredQuery, tab: 'overview' },
      })
    }
  }, [currentUserRoles, router])

  const entryKindDisplay = useCallback(
    (kind: string) => {
      if (entry.kind === EntryKind.MODEL) {
        return 'Model'
      }
      if (entry.kind === EntryKind.DATA_CARD) {
        return 'Data Card'
      }
      return kind
    },
    [entry.kind],
  )

  const includesTypeFilter = useCallback(
    (kind: string) => {
      return (
        (includeEntryFilter && kind === EntryLogKind.Entry) ||
        (includeFormFilter && kind === EntryLogKind.Form) ||
        (includeReleasesFilter && kind === EntryLogKind.Release) ||
        (includeAccessesFilter && kind === EntryLogKind.AccessRequest) ||
        (includeReviewsFilter && kind === EntryLogKind.Review)
      )
    },
    [includeAccessesFilter, includeEntryFilter, includeFormFilter, includeReleasesFilter, includeReviewsFilter],
  )

  const betweenDateFilters = useCallback(
    (timestamp: string) => {
      if (startDateFilter !== null && endDateFilter !== null) {
        return timestamp >= startDateFilter.toISOString() && timestamp <= endDateFilter.toISOString()
      }
      return true
    },
    [endDateFilter, startDateFilter],
  )

  const logs = useMemo(() => {
    return entry.logs
      .filter((log) => Object.keys(log).some((k) => log[k].toString().toLowerCase().indexOf(tableFilter) != -1))
      .filter((log) => includesTypeFilter(log.kind))
      .filter((log) => betweenDateFilters(log.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((log) => (
        <TableRow
          key={log.timestamp}
          sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: theme.palette.container.main }}
        >
          <TableCell component='th' scope='row'>
            <UserDisplay dn={log.userDn} />
          </TableCell>
          <TableCell>{log.kind === EntryLogKind.Entry ? entryKindDisplay(log.kind) : log.kind}</TableCell>
          <TableCell>{log.log}</TableCell>
          <TableCell>{formatDateTimeString(log.timestamp)}</TableCell>
        </TableRow>
      ))
  }, [betweenDateFilters, entry.logs, entryKindDisplay, includesTypeFilter, tableFilter, theme.palette.container.main])

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading || !uiConfig) {
    return <Loading />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} divider={<Divider orientation='vertical' flexItem />}>
        <Stack>
          <Typography fontWeight='bold'>Filter by log type</Typography>
          <FormControlLabel
            control={
              <Checkbox checked={includeEntryFilter} onChange={(e) => setIncludeEntryFilter(e.target.checked)} />
            }
            label={toSentenceCase(entry.kind)}
          />
          <FormControlLabel
            control={<Checkbox checked={includeFormFilter} onChange={(e) => setIncludeFormFilter(e.target.checked)} />}
            label='Form'
          />
          <FormControlLabel
            control={
              <Checkbox checked={includeReleasesFilter} onChange={(e) => setIncludeReleasesFilter(e.target.checked)} />
            }
            label='Releases'
          />
          <FormControlLabel
            control={
              <Checkbox checked={includeAccessesFilter} onChange={(e) => setIncludeAccessesFilter(e.target.checked)} />
            }
            label='Access Requests'
          />
          <FormControlLabel
            control={
              <Checkbox checked={includeReviewsFilter} onChange={(e) => setIncludeReviewsFilter(e.target.checked)} />
            }
            label='Reviews'
          />
        </Stack>
        <Stack spacing={3}>
          <Box>
            <Stack
              direction={{ sm: 'column', md: 'row' }}
              justifyContent='space-between'
              sx={{ width: '100%' }}
              spacing={2}
            >
              <TextField
                placeholder='Filter by user, kind, log message or time'
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
              />
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
                <DateTimePicker
                  label='Start date'
                  value={startDateFilter}
                  onChange={(newValue) => setStartDateFilter(newValue)}
                />
                <DateTimePicker
                  label='End date'
                  value={endDateFilter}
                  onChange={(newValue) => setEndDateFilter(newValue)}
                />
              </Stack>
            </Stack>
          </Box>
          <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
            <Table sx={{ minWidth: 650 }} size='small' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Log Message</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{logs}</TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>
    </Container>
  )
}
