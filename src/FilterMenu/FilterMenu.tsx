import React, { ReactElement, useState, ChangeEvent } from 'react'
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
import LogLevelSelect from './LogLevelSelect'
import { LogLevel } from '../../types/interfaces'
import getLogLevelLabel from '../../utils/getLogLevelLabel'

interface FilterMenuProps {
  logLevel: LogLevel
  onLogLevelChange: (event: SelectChangeEvent<LogLevel>) => void
  buildId: string
  onBuildIdChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  requestId: string
  onRequestIdChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  search: string
  onSearchChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  isRegex: boolean
  onIsRegexChange: (event: ChangeEvent<HTMLInputElement>) => void
  onGetLogs: () => void
}
export default function FilterMenu({
  logLevel,
  onLogLevelChange,
  buildId,
  onBuildIdChange,
  requestId,
  onRequestIdChange,
  search,
  onSearchChange,
  isRegex,
  onIsRegexChange,
  onGetLogs,
}: FilterMenuProps): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const handleFiltersClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleGetLogs = () => {
    handleClose()
    onGetLogs()
  }

  return (
    <>
      <Chip label={`Log level: ${getLogLevelLabel(logLevel)}`} color='primary' sx={{ mr: 1 }} />
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
      <Tooltip title='Filter'>
        <IconButton color='primary' size='small' aria-label='filters' onClick={handleFiltersClick} sx={{ mr: 1 }}>
          <FilterIcon />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClose}
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
            <IconButton size='small' onClick={handleClose} sx={{ ml: 'auto', mr: -0.5, mt: -0.5 }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mt: 1, mb: 2 }} />
          <Box sx={{ mx: 1 }}>
            <LogLevelSelect value={logLevel} onChange={onLogLevelChange} />
            <Tooltip title={requestId ? 'Unable to provide a Build ID, a Request ID has already been provided.' : ''}>
              <TextField
                label='Build ID'
                value={buildId}
                size='small'
                disabled={!!requestId}
                onChange={onBuildIdChange}
                sx={{ minWidth: '300px', mb: 1 }}
              />
            </Tooltip>
            <Tooltip title={buildId ? 'Unable to provide a Request ID, a Build ID has already been provided.' : ''}>
              <TextField
                label='Request ID'
                value={requestId}
                size='small'
                disabled={!!buildId}
                onChange={onRequestIdChange}
                sx={{ minWidth: '300px', mb: 1 }}
              />
            </Tooltip>
            <TextField
              multiline
              label='Search'
              value={search}
              size='small'
              onChange={onSearchChange}
              sx={{ minWidth: '300px', mb: 1 }}
            />
            <FormControlLabel
              label='Enable Regex'
              control={<Checkbox checked={isRegex} onChange={onIsRegexChange} />}
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
