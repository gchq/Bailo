import * as React from 'react'
import { WidgetProps } from '@rjsf/core'
import { Typography } from '@mui/material'
import { useGetUiConfig } from '../../data/uiConfig'
import SelectWidget from './SelectWidget'

export default function BuilderImageSelector(props: WidgetProps): any {
  const { uiConfig } = useGetUiConfig()
  const [selectProps, setSelectProps] = React.useState(props)

  React.useEffect(() => {
    if (!uiConfig) return

    const { options, value } = props
    options.enumOptions = uiConfig.builderImages.map((version) => ({ value: version.image, label: version.name }))

    setSelectProps({ ...props, value })
  }, [uiConfig, props])

  const { options } = selectProps
  if (!options.enumOptions) {
    return <Typography variant='body1'>Loading...</Typography>
  }

  return <SelectWidget {...selectProps} />
}
