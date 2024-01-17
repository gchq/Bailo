import { Badge, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { ReactElement } from 'react'
import Link from 'src/Link'

interface NavMenuItemProps {
  menuPage: string
  selectedPage: string
  drawerOpen: boolean
  href: string
  icon: ReactElement
  primaryText: string
  title: string
  badgeCount?: number
}
export function NavMenuItem({
  menuPage,
  drawerOpen,
  icon,
  href,
  primaryText,
  selectedPage,
  title,
  badgeCount = 0,
}: NavMenuItemProps) {
  return (
    <ListItem disablePadding>
      <Link href={href} noLinkStyle>
        <ListItemButton selected={selectedPage === menuPage}>
          <ListItemIcon>
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
          <ListItemText primary={primaryText} sx={{ textDecoration: 'none' }} />
        </ListItemButton>
        {drawerOpen}
      </Link>
    </ListItem>
  )
}
