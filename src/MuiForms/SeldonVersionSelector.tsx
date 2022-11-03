import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import * as React from 'react'
import { useGetUiConfig } from '../../data/uiConfig'

export default function SeldonVersionSelector(props: any) {
  
  const { uiConfig } = useGetUiConfig()
  const [open, setOpen] = React.useState(false)

  const [seldonVersions, setSeldonVersions] = React.useState<Array<string>>([])

  React.useEffect(() => {
    if (uiConfig !== undefined) {
      setSeldonVersions(uiConfig.seldon.versions)
    }
  }, [uiConfig])

  const { onChange, value: currentValue, required, label } = props

  const _onChange = (_event: any, newValue: any) => {
    onChange(newValue?.id)
  }

  return seldonVersions.length === 0 ? <></> : (
    <Select
      labelId='seldon-version-label'
      id='seldon-version-selector'
      value={currentValue || null}
      label='Seldon Version'
      onChange={onChange}
    >
      {seldonVersions.map((version: any) => (
        <MenuItem key={`item-${version}`} value={version}>
          {version}
        </MenuItem>
      ))}
    </Select>
  )
}
