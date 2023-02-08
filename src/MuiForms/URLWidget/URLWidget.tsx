import React from 'react'
import { TextWidgetProps } from '../TextWidget.js'

function URLWidget(props: TextWidgetProps) {
  const { registry } = props
  const { TextWidget } = registry.widgets
  return <TextWidget type='url' {...props} />
}

export default URLWidget
