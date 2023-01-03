import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { SeldonVersion } from '@/types/interfaces'
import MenuItem from '@mui/material/MenuItem'
import { TextField } from '@mui/material'
import { useGetUiConfig } from '../../data/uiConfig'

type SeldonVersionSelectorProps = {
  label: string
  value: string
  required: boolean
  readonly: boolean
  onChange: (value: string) => void
}

export default function SeldonVersionSelector({
  label,
  value,
  required,
  readonly,
  onChange,
}: SeldonVersionSelectorProps) {
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

  if (readonly) {
    return null
  }

  return (
    <TextField
      select
      label={`${label}${required ? ' *' : ''}`}
      value={value || ''}
      onChange={handleChange}
      id='seldon-version-select'
    >
      {options}
    </TextField>
  )
}
