import React, { ReactNode, useEffect } from 'react'
import Tooltip, { TooltipProps } from '@mui/material/Tooltip'

function DisabledButtonInfo({
  conditions,
  placement,
  children,
}: {
  conditions: string[]
  placement?: TooltipProps['placement']
  children: ReactNode
}) {
  const [titleText, setTitleText] = React.useState<string>('')

  useEffect(() => {
    if (conditions !== undefined) {
      let updatedTitleText = ''
      conditions.forEach((condition) => {
        if (condition !== '') {
          updatedTitleText = `${updatedTitleText} ${condition}`
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
