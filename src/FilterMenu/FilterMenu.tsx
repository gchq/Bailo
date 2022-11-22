import React, { ReactElement, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import FilterIcon from '@mui/icons-material/FilterAltTwoTone'
import RegexIcon from '@mui/icons-material/NewReleases'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import { SelectChangeEvent } from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'
import isLogLevel, { isLogLevelString } from '@/utils/type-guards/isLogLevel'
import LogLevelSelect from './LogLevelSelect'
import { LogLevel } from '../../types/interfaces'
import getLogLevelLabel from '../../utils/getLogLevelLabel'

export type LogFilters = {
  level: LogLevel
  buildId: string
  requestId: string
  search: string
  isRegex: boolean
}

type FilterMenuProps = {
  currentFilters: LogFilters
  onGetLogs: (filters: LogFilters) => void
}
export default function FilterMenu({ currentFilters, onGetLogs }: FilterMenuProps): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [level, setLevel] = useState<LogLevel>(LogLevel.TRACE)
  const [buildId, setBuildId] = useState('')
  const [requestId, setRequestId] = useState('')
  const [search, setSearch] = useState('')
  const [isRegex, setIsRegex] = useState(false)

  const handleFiltersClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (resetFilters = false) => {
    if (resetFilters) {
      setLevel(currentFilters.level)
      setBuildId(currentFilters.buildId)
      setRequestId(currentFilters.requestId)
      setSearch(currentFilters.search)
      setIsRegex(currentFilters.isRegex)
    }
    setAnchorEl(null)
  }

  const handleLogLevelChange = (event: SelectChangeEvent<LogLevel>): void => {
    if (isLogLevel(event.target.value)) setLevel(event.target.value)
    else if (isLogLevelString(event.target.value)) setLevel(parseInt(event.target.value, 10))
  }

  const handleGetLogs = () => {
    handleClose()
    onGetLogs({ level, buildId, requestId, search, isRegex })
  }

  return (
    <>
      <Chip label={`Log level: ${getLogLevelLabel(level)}`} color='primary' sx={{ mr: 1 }} />
      {buildId && <Chip label={`Build ID: ${buildId}`} color='primary' sx={{ mr: 1 }} />}
      {requestId && <Chip label={`Request ID: ${requestId}`} color='primary' sx={{ mr: 1 }} />}
      {search && (
        <Chip
          label={`Search: ${search}`}
          color='primary'
          icon={
            isRegex ? (
              <Tooltip title='Regex enabled'>
                <RegexIcon />
              </Tooltip>
            ) : undefined
          }
          sx={{ mr: 1 }}
        />
      )}
      <Tooltip title='Filters'>
        <IconButton color='primary' size='small' aria-label='filters' onClick={handleFiltersClick} sx={{ mr: 1 }}>
          <FilterIcon />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={(): void => handleClose(true)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box width='500px' p={1}>
          <Box display='flex' ml={1}>
            <Box mt='auto'>Filters</Box>
            <IconButton size='small' onClick={(): void => handleClose(true)} sx={{ ml: 'auto', mr: -0.5, mt: -0.5 }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mt: 1, mb: 2 }} />
          <Box sx={{ mx: 1 }}>
            <LogLevelSelect value={level} onChange={handleLogLevelChange} />
            <Tooltip title={requestId ? 'Unable to provide a Build ID, a Request ID has already been provided.' : ''}>
              <TextField
                label='Build ID'
                value={buildId}
                size='small'
                disabled={!!requestId}
                onChange={(event): void => setBuildId(event.target.value)}
                sx={{ minWidth: '300px', mb: 1 }}
              />
            </Tooltip>
            <Tooltip title={buildId ? 'Unable to provide a Request ID, a Build ID has already been provided.' : ''}>
              <TextField
                label='Request ID'
                value={requestId}
                size='small'
                disabled={!!buildId}
                onChange={(event): void => setRequestId(event.target.value)}
                sx={{ minWidth: '300px', mb: 1 }}
              />
            </Tooltip>
            <TextField
              multiline
              label='Search'
              value={search}
              size='small'
              onChange={(event): void => setSearch(event.target.value)}
              sx={{ minWidth: '300px', mb: 1 }}
            />
            <FormControlLabel
              label='Enable Regex'
              control={<Checkbox checked={isRegex} onChange={(event): void => setIsRegex(event.target.checked)} />}
              sx={{ ml: 1 }}
            />
          </Box>
          <Box display='flex'>
            <Button variant='contained' size='small' onClick={handleGetLogs} sx={{ mx: 'auto', mt: 1, mb: 0.5 }}>
              Get Logs
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
