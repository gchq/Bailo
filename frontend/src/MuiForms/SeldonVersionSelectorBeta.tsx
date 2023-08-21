/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextField } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
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

  if (readOnly) {
    return null
  }

  return (
    <TextField
      select={!formContext.editMode ? false : true}
      size='small'
      variant={!formContext.editMode ? 'standard' : 'outlined'}
      sx={
        !formContext.editMode
          ? { label: { WebkitTextFillColor: 'black' } }
          : { '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'black' } }
      }
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
