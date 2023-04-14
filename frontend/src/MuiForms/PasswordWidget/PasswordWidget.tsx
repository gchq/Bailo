import React from 'react'

import { TextWidgetProps } from '../TextWidget/index'

function PasswordWidget(props: TextWidgetProps) {
  const { registry } = props
  const { TextWidget } = registry.widgets
  return <TextWidget type='password' {...props} />
}

export default PasswordWidget
