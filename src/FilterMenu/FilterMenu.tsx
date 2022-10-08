import React, { Dispatch, ReactElement, useState, SetStateAction } from 'react'
import FilterIcon from '@mui/icons-material/FilterAltTwoTone'
import RegexIcon from '@mui/icons-material/NewReleases'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import { SelectChangeEvent } from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'
import LogLevelSelect, { LogLevel } from './LogLevelSelect'
import { toTitleCase } from '../../utils/stringUtils'

// TODO me - move into type-guards once that has been merged into main
const isLogLevel = (value: LogLevel | string): value is LogLevel => !!LogLevel[value]

interface FilterMenuProps {
  logLevel: LogLevel
  setLogLevel: Dispatch<SetStateAction<LogLevel>>
  buildId: string
  setBuildId: Dispatch<SetStateAction<string>>
  requestId: string
  setRequestId: Dispatch<SetStateAction<string>>
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  isRegex: boolean
  setIsRegex: Dispatch<SetStateAction<boolean>>
}
export default function FilterMenu({
  logLevel,
  setLogLevel,
  buildId,
  setBuildId,
  requestId,
  setRequestId,
  search,
  setSearch,
  isRegex,
  setIsRegex,
}: FilterMenuProps): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogLevelChange = (event: SelectChangeEvent<LogLevel>): void => {
    if (isLogLevel(event.target.value)) setLogLevel(event.target.value)
  }

  return (
    <>
      <Chip label={`Log level: ${toTitleCase(LogLevel[logLevel])}`} sx={{ mr: 1 }} />
      {buildId && <Chip label={`Build ID: ${buildId}`} sx={{ mr: 1 }} />}
      {requestId && <Chip label={`Request ID: ${requestId}`} sx={{ mr: 1 }} />}
      {search && (
        <Chip
          label={`Search: ${search}`}
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
        <IconButton color='primary' size='small' aria-label='filters' onClick={handleClick} sx={{ mr: 1 }}>
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
        {/* TODO me - dynamically size based on contents */}
        <Box width='500px' p={1}>
          <Box ml={1}>Filters</Box>
          <Divider sx={{ mt: 1, mb: 2 }} />
          <LogLevelSelect value={logLevel} onChange={handleLogLevelChange} />
          {/* TODO me - Figure out nice way to make buildId and requestId mutually exclusive input fields */}
          <TextField
            label='Build ID'
            value={buildId}
            size='small'
            onChange={(event): void => setBuildId(event.target.value)}
            sx={{ minWidth: '300px', mb: 1 }}
          />
          <TextField
            label='Request ID'
            value={requestId}
            size='small'
            onChange={(event): void => setRequestId(event.target.value)}
            sx={{ minWidth: '300px', mb: 1 }}
          />
          <TextField
            label='Search'
            value={search}
            size='small'
            onChange={(event): void => setSearch(event.target.value)}
            sx={{ minWidth: '300px', mb: 1 }}
          />
          <FormControlLabel
            label='Enable Regex'
            control={<Checkbox checked={isRegex} onChange={(event): void => setIsRegex(event.target.checked)} />}
            sx={{ ml: 2 }}
          />
        </Box>
      </Popover>
    </>
  )
}
