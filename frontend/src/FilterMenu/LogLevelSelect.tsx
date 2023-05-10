import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import React, { ReactElement } from 'react'

import { LogLevel, LogLevelLabel } from '../../types/types'

type LogLevelSelectProps = {
  value: LogLevel
  onChange: (event: SelectChangeEvent<LogLevel>) => void
}

export default function LogLevelSelect({ value, onChange }: LogLevelSelectProps): ReactElement {
  return (
    <FormControl size='small' sx={{ minWidth: '300px', mb: 1 }}>
      <InputLabel>Log Level</InputLabel>
      <Select label='Log Level' value={value} onChange={onChange}>
        {Object.values(LogLevelLabel).map((level) => (
          <MenuItem value={LogLevel[level.toUpperCase()]} key={level}>
            {level}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
