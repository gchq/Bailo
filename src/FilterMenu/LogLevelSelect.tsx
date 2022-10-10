import React, { ReactElement } from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { toTitleCase } from '../../utils/stringUtils'

export enum LogLevelValue {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
}

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

type LogLevelSelectProps = {
  value: LogLevel
  onChange: (event: SelectChangeEvent<LogLevel>) => void
}

export default function LogLevelSelect({ value, onChange }: LogLevelSelectProps): ReactElement {
  return (
    <FormControl size='small' sx={{ minWidth: '300px', mb: 1 }}>
      <InputLabel>Log Level</InputLabel>
      <Select label='Log Level' value={value} onChange={onChange}>
        {Object.keys(LogLevel).map((level) => (
          <MenuItem value={LogLevel[level]} key={level}>
            {toTitleCase(level)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
