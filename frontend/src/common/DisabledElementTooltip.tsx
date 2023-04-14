import Tooltip, { TooltipProps } from '@mui/material/Tooltip'
import React, { ReactNode, useEffect } from 'react'

function DisabledElementTooltip({
  conditions,
  children,
  placement,
}: {
  conditions: string[]
  children: ReactNode
  placement?: TooltipProps['placement']
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
    <Tooltip arrow title={titleText} placement={placement || 'right'}>
      <div>{children}</div>
    </Tooltip>
  )
}

export default DisabledElementTooltip
