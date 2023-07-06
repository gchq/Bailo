import CloseIcon from '@mui/icons-material/Close'
import FilterIcon from '@mui/icons-material/FilterAltTwoTone'
import RegexIcon from '@mui/icons-material/NewReleases'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import { SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import React, { ReactElement, useState } from 'react'

import { LogLevel } from '../../types/types'
import getLogLevelLabel from '../../utils/getLogLevelLabel'
import isLogLevel, { isLogLevelString } from '../../utils/type-guards/isLogLevel'
import LogLevelSelect from './LogLevelSelect'

export type LogFilters = {
  level: LogLevel
  buildId: string
  approvalId: string
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
  const [approvalId, setApprovalId] = useState('')
  const [search, setSearch] = useState('')
  const [isRegex, setIsRegex] = useState(false)

  const handleFiltersClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (resetFilters = false) => {
    if (resetFilters) {
      setLevel(currentFilters.level)
      setBuildId(currentFilters.buildId)
      setApprovalId(currentFilters.approvalId)
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
    onGetLogs({ level, buildId, approvalId, search, isRegex })
  }

  return (
    <>
      <Chip label={`Log level: ${getLogLevelLabel(level)}`} color='primary' sx={{ mr: 1 }} />
      {buildId && <Chip label={`Build ID: ${buildId}`} color='primary' sx={{ mr: 1 }} />}
      {approvalId && <Chip label={`Approval ID: ${approvalId}`} color='primary' sx={{ mr: 1 }} />}
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
            <Tooltip title={approvalId ? 'Unable to provide a Build ID, an Approval ID has already been provided' : ''}>
              <TextField
                label='Build ID'
                value={buildId}
                size='small'
                disabled={!!approvalId}
                onChange={(event): void => setBuildId(event.target.value)}
                sx={{ minWidth: '300px', mb: 1 }}
              />
            </Tooltip>
            <Tooltip title={buildId ? 'Unable to provide an Approval ID, a Build ID has already been provided' : ''}>
              <TextField
                label='Approval ID'
                value={approvalId}
                size='small'
                disabled={!!buildId}
                onChange={(event): void => setApprovalId(event.target.value)}
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
