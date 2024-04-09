import { ListItem, ListItemButton } from '@mui/material'
import { MouseEventHandler, ReactNode } from 'react'

type SimpleListItemButtonProps = {
  selected: boolean
  onClick: MouseEventHandler<HTMLDivElement>
  children: ReactNode
}
export default function SimpleListItemButton({ selected, onClick, children }: SimpleListItemButtonProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton selected={selected} onClick={onClick}>
        {children}
      </ListItemButton>
    </ListItem>
  )
}
