import React from 'react'
import { utils } from '@rjsf/core'
import { TextWidgetProps } from '../TextWidget'

const { localToUTC, utcToLocal } = utils

const DateTimeWidget = (props: TextWidgetProps) => {
  const { registry } = props
  const { TextWidget } = registry.widgets
  const value = utcToLocal(props.value)
  const onChange = (newValue: any) => {
    props.onChange(localToUTC(newValue))
  }

  return (
    <TextWidget
      type='datetime-local'
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
      value={value}
      onChange={onChange}
    />
  )
}

export default DateTimeWidget
