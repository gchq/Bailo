import { utils } from '@rjsf/core'
import React from 'react'
import { TextWidgetProps } from '../TextWidget'

const { localToUTC, utcToLocal } = utils

function DateTimeWidget(props: TextWidgetProps) {
  const { registry, value: propsValue, onChange: propsOnChange } = props
  const { TextWidget } = registry.widgets
  const value = utcToLocal(propsValue)
  const onChange = (newValue: string) => {
    propsOnChange(localToUTC(newValue))
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
