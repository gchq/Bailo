import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Popover from '@mui/material/Popover'
import React, { ReactNode } from 'react'

type AnchorPosition = {
  anchorPositionTop: number
  anchorPositionLeft: number
}
type AnchorOrigin = {
  vertical: 'top' | 'center' | 'bottom'
  horizontal: 'left' | 'center' | 'right'
}
type TransformOrigin = {
  vertical: 'top' | 'center' | 'bottom'
  horizontal: 'left' | 'center' | 'right'
}
type Props = {
  anchorOrigin?: AnchorOrigin
  transformOrigin?: TransformOrigin
  anchorPosition?: AnchorPosition
  onClose?: () => void
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
      />

      <Popover
        id='help-popover'
        sx={{ pointerEvents: 'none', maxWidth: '65%' }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        onClose={handlePopoverClose}
      >
        {children}
      </Popover>
    </>
  )
}
export default HelpPopover
