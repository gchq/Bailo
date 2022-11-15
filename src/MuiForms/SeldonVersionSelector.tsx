import { SeldonVersion } from '@/types/interfaces'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import * as React from 'react'
import { useGetUiConfig } from '../../data/uiConfig'

export default function SeldonVersionSelector({
  onChange,
  value: currentValue,
  required,
  label,
  readonly,
}: {
  onChange: (value: string) => void
  value: string
  required: boolean
  label: string
  readonly: boolean
}) {
  const { uiConfig } = useGetUiConfig()

  const [seldonVersions, setSeldonVersions] = React.useState<Array<SeldonVersion>>([])

  React.useEffect(() => {
    if (uiConfig !== undefined) {
      setSeldonVersions(uiConfig.seldonVersions)
    }
  }, [uiConfig])

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    onChange(event.target.value as string)
  }

  return readonly ? null : (
    <Select value={currentValue || ''} label={label + (required ? ' *' : '')} onChange={handleChange}>
      {seldonVersions.map((version: SeldonVersion) => (
        <MenuItem key={`item-${version.name}`} value={version.image}>
          {version.name}
        </MenuItem>
      ))}
    </Select>
  )
}
