import Box from '@mui/material/Box'
import Tooltip, { TooltipProps } from '@mui/material/Tooltip'
import { CSSProperties, ReactNode, useEffect, useState } from 'react'

function DisabledElementTooltip({
  conditions,
  children,
  placement,
  display = 'block',
}: {
  conditions: string[]
  children: ReactNode
  placement?: TooltipProps['placement']
  display?: CSSProperties['display']
}) {
  const [titleText, setTitleText] = useState('')

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
      <Box display={display}>{children}</Box>
    </Tooltip>
  )
}

export default DisabledElementTooltip
