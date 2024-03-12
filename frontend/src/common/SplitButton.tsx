import { ArrowDropDown } from '@mui/icons-material'
import { Button, ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material'
import { MouseEvent, MouseEventHandler, ReactNode, useRef, useState } from 'react'

type SplitButtonProps = {
  options: string[]
  onPrimaryButtonClick: MouseEventHandler<HTMLButtonElement>
  onMenuItemClick: (selectedOption: string) => void
  children: ReactNode
}

export default function SplitButton({ options, onPrimaryButtonClick, onMenuItemClick, children }: SplitButtonProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const handleMenuItemClick = (_event: MouseEvent, index: number) => {
    onMenuItemClick(options[index])
    setOpen(false)
  }

  const handleToggleMenu = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <ButtonGroup variant='contained'>
        <Button onClick={onPrimaryButtonClick}>{children}</Button>
        <Button
          size='small'
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup='menu'
          ref={anchorRef}
          onClick={handleToggleMenu}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Popper
        transition
        disablePortal
        open={open}
        anchorEl={anchorRef.current}
        sx={{
          zIndex: 1399,
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={1}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList dense autoFocusItem id='split-button-menu'>
                  {options.map((option, index) => (
                    <MenuItem key={option} onClick={(event) => handleMenuItemClick(event, index)}>
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  )
}
