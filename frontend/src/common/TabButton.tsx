import { ListItem, ListItemButton } from '@mui/material'
import { MouseEventHandler, ReactNode } from 'react'

type TabButtonProps = {
  selected: boolean
  onClick: MouseEventHandler<HTMLDivElement>
  children: ReactNode
}
export default function TabButton({ selected, onClick, children }: TabButtonProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton selected={selected} onClick={onClick}>
        {children}
      </ListItemButton>
    </ListItem>
  )
}
