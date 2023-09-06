/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextField } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material/styles'
import { WidgetProps } from '@rjsf/utils'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'

import { useGetUiConfig } from '../../data/uiConfig'
import { SeldonVersion } from '../../types/types'

export default function SeldonVersionSelector({
  formContext,
  label,
  value,
  currentValue,
  readOnly,
  onChange,
}: WidgetProps) {
  const { uiConfig } = useGetUiConfig()
  const [seldonVersions, setSeldonVersions] = useState<Array<SeldonVersion>>([])

  useEffect(() => {
    if (uiConfig) setSeldonVersions(uiConfig.seldonVersions)
  }, [uiConfig])

  const options = useMemo(
    () =>
      seldonVersions.map((version: SeldonVersion) => (
        <MenuItem key={`item-${version.name}`} value={version.image}>
          {version.name}
        </MenuItem>
      )),
    [seldonVersions]
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const theme = useTheme()

  if (readOnly) {
    return null
  }

  return (
    <TextField
      select={!formContext.editMode ? false : true}
      size='small'
      variant={!formContext.editMode ? 'standard' : 'outlined'}
      sx={{
        input: {
          color: theme.palette.mode === 'light' ? 'black' : 'white',
        },
        label: {
          WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
        },
      }}
      label={label}
      required={!formContext.editMode ? false : true}
      value={value || ''}
      onChange={handleChange}
      id={'seldon-version-select'}
      disabled={!formContext.editMode}
      InputProps={{
        disableUnderline: !formContext.editMode ? true : false,
      }}
    >
      {options}
    </TextField>
  )
}
