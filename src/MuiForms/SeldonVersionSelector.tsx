import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import * as React from 'react'
import { useGetUiConfig } from '../../data/uiConfig'

export default function SeldonVersionSelector(props: any) {
  
  const { uiConfig } = useGetUiConfig()

  const [seldonVersions, setSeldonVersions] = React.useState<Array<string>>([])

  React.useEffect(() => {
    if (uiConfig !== undefined) {
      setSeldonVersions(uiConfig.seldon.versions)
    }
  }, [uiConfig])

  const { onChange, value: currentValue, required, label, readonly } = props

  const _onChange = (_event: any, newValue: any) => {
    onChange(newValue?.props.value)
  }

  return readonly ? (<></>) : (
    <>
    <Select
      labelId='seldon-version-label'
      id='seldon-version-selector'
      value={currentValue || ''}
      label={'test' + label + (required ? ' *' : '')}
      onChange={_onChange}
    >
      {seldonVersions.map((version: any) => (
        <MenuItem key={`item-${version}`} value={version}>
          {version}
        </MenuItem>
      ))}
    </Select></>
  )
}
