import { Badge, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import Link from 'next/link'
import { ReactElement } from 'react'

interface MenuItemProps {
  menuPage: string
  selectedPage: string
  drawerOpen: boolean
  href: string
  icon: ReactElement
  primaryText: string
  title: string
  dataTest?: string
  badgeCount?: number
}
export function NavMenuItem({
  menuPage,
  drawerOpen,
  icon,
  href,
  primaryText,
  dataTest = '',
  selectedPage,
  title,
  badgeCount = 0,
}: MenuItemProps) {
  return (
    <ListItem disablePadding>
      <Link href={href}>
        <ListItemButton selected={selectedPage === menuPage}>
          <ListItemIcon data-test={dataTest}>
            {!drawerOpen ? (
              <Tooltip arrow title={title} placement='right'>
                <Badge badgeContent={badgeCount} color='secondary' invisible={badgeCount === 0}>
                  {icon}
                </Badge>
              </Tooltip>
            ) : (
              <>
                <Badge badgeContent={badgeCount} color='secondary' invisible={badgeCount === 0}>
                  {icon}
                </Badge>
              </>
            )}
          </ListItemIcon>
          <ListItemText primary={primaryText} />
        </ListItemButton>
        {drawerOpen}
      </Link>
    </ListItem>
  )
}
