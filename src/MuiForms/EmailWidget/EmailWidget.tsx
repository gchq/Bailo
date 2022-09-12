import React from 'react'
import { TextWidgetProps } from '../TextWidget'

function EmailWidget(props: TextWidgetProps) {
  const { registry } = props
  const { TextWidget } = registry.widgets
  return <TextWidget type='email' {...props} />
}

export default EmailWidget
