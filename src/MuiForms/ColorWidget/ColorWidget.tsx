import React from 'react'
import { TextWidgetProps } from '../TextWidget'

function ColorWidget(props: TextWidgetProps) {
  const { registry } = props
  const { TextWidget } = registry.widgets
  return <TextWidget type='color' {...props} />
}

export default ColorWidget
