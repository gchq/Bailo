import { ListItem, ListItemButton } from '@mui/material'
import { MouseEventHandler, ReactNode } from 'react'

type SimpleListItemButtonProps = {
  selected: boolean
  onClick: MouseEventHandler<HTMLDivElement>
  children: ReactNode
  disabled?: boolean
}
export default function SimpleListItemButton({
  selected,
  onClick,
  children,
  disabled = false,
}: SimpleListItemButtonProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton disabled={disabled} selected={selected} onClick={onClick}>
        {children}
      </ListItemButton>
    </ListItem>
  )
}
