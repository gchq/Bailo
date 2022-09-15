import React, { ReactNode, useEffect } from 'react'
import Tooltip, { TooltipProps } from '@mui/material/Tooltip'

export type DisabledButtonConditions = {
  condition: boolean
  message: string
}

function DisabledButtonInfo({
  conditions,
  placement,
  children,
}: {
  conditions: DisabledButtonConditions[]
  placement?: TooltipProps['placement']
  children: ReactNode
}) {
  const [titleText, setTitleText] = React.useState<string>('')

  useEffect(() => {
    if (conditions !== undefined) {
      let updatedTitleText = ''
      conditions.forEach(({ condition, message }) => {
        if (condition) {
          updatedTitleText = `${updatedTitleText} ${message}`
        }
      })
      setTitleText(updatedTitleText)
    }
  }, [conditions])

  return (
    <Tooltip title={titleText} arrow placement={placement !== undefined ? placement : 'right'}>
      <span>{children}</span>
    </Tooltip>
  )
}

export default DisabledButtonInfo
