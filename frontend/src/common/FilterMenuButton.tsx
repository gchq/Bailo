import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CheckIcon from '@mui/icons-material/Check'
import { Button, ListItemIcon, Menu, MenuItem } from '@mui/material'
import { MouseEvent, useState } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterMenuButtonProps {
  label: string
  allValue?: string
  options: FilterOption[]
  selectedValue: string
  onSelect: (value: string) => void
}

/**
 * Dropdown filter button that displays selectable options and indicates when a filter is applied.
 *
 * @param label Button label shown when no filter is selected.
 * @param allValue Value representing the unfiltered state. Defaults to 'All'.
 * @param options Available options displayed in the dropdown menu.
 * @param selectedValue Currently selected option value.
 * @param onSelect Callback invoked when an option is selected.
 */
export function FilterMenuButton({ label, allValue = 'All', options, selectedValue, onSelect }: FilterMenuButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleSelect = (value: string) => {
    onSelect(value)
    handleClose()
  }

  const selectedCount = selectedValue !== allValue ? 1 : 0
  const buttonLabel = selectedCount > 0 ? `${label} (${selectedCount})` : label

  return (
    <>
      <Button
        variant='outlined'
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
      >
        {buttonLabel}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === selectedValue}
            onClick={() => handleSelect(option.value)}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              {option.value === selectedValue ? <CheckIcon fontSize='small' /> : null}
            </ListItemIcon>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
