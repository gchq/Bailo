import { ListItem, ListItemButton, ListItemIcon } from '@mui/material'
import { MouseEventHandler, ReactElement, ReactNode } from 'react'

type SimpleListItemButtonProps = {
  selected: boolean
  onClick: MouseEventHandler<HTMLDivElement>
  children: ReactNode
  disabled?: boolean
  icon?: ReactElement
}
export default function SimpleListItemButton({
  selected,
  onClick,
  children,
  disabled = false,
  icon,
}: SimpleListItemButtonProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton disabled={disabled} selected={selected} onClick={onClick}>
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        {children}
      </ListItemButton>
    </ListItem>
  )
}
