import * as React from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import DisabledElementTooltip from './DisabledElementTooltip'

export default function SplitButton({
  title,
  primaryDisabled,
  options,
  onButtonClick,
  onMenuItemClick,
}: {
  title: string
  primaryDisabled: string | undefined
  options: { label: string; disabledReason: string | undefined }[]
  onButtonClick: () => void
  onMenuItemClick: (item: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const anchorRef = React.useRef<HTMLDivElement>(null)

  const handleMenuItemClick = (_event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
    onMenuItemClick(options[index].label)
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  return (
    <>
      <ButtonGroup variant='contained' ref={anchorRef} aria-label='split button'>
        <DisabledElementTooltip conditions={[primaryDisabled === undefined ? '' : primaryDisabled]}>
          <Button onClick={onButtonClick} disabled={!(primaryDisabled === undefined)}>
            {title}
          </Button>
        </DisabledElementTooltip>
        <Button
          size='small'
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label='select merge strategy'
          aria-haspopup='menu'
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu' autoFocusItem>
                  {options.map((option, index) => (
                    <DisabledElementTooltip
                      key={option.label}
                      conditions={[option.disabledReason === undefined ? '' : option.disabledReason]}
                    >
                      <MenuItem
                        key={option.label}
                        onClick={(event) => handleMenuItemClick(event, index)}
                        disabled={!(option.disabledReason === undefined)}
                      >
                        {option.label}
                      </MenuItem>
                    </DisabledElementTooltip>
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

export function menuItemData(
  itemLabel: string,
  itemDisabledReason: string | undefined
): { label: string; disabledReason: string | undefined } {
  return { label: itemLabel, disabledReason: itemDisabledReason }
}
