import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Typography } from '@mui/material'
import Popover, { PopoverProps } from '@mui/material/Popover'
import React, { ReactNode } from 'react'

type Props = {
  anchorOrigin?: PopoverProps['anchorOrigin']
  transformOrigin?: PopoverProps['transformOrigin']
  children: ReactNode
}

function HelpPopover({ anchorOrigin, transformOrigin, children }: Props) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const handlePopoverOpen = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLElement)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  return (
    <>
      <HelpOutlineIcon
        aria-owns={open ? 'help-popover' : undefined}
        aria-haspopup='true'
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        data-test='helpIcon'
        color='primary'
      />
      <Popover
        id='help-popover'
        sx={{ pointerEvents: 'none', maxWidth: '65%' }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={
          anchorOrigin || {
            vertical: 'bottom',
            horizontal: 'center',
          }
        }
        transformOrigin={
          transformOrigin || {
            vertical: 'top',
            horizontal: 'center',
          }
        }
        onClose={handlePopoverClose}
      >
        <Typography sx={{ p: 1 }}>{children}</Typography>
      </Popover>
    </>
  )
}
export default HelpPopover
