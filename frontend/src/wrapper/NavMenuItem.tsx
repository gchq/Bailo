import { Badge, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactElement } from 'react'

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
  const theme = useTheme()
  return (
    <ListItem disablePadding>
      {/* <Link noLinkStyle sx={{ width: '100%' }}> */}
      <ListItemButton href={href} selected={selectedPage === menuPage}>
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
        <ListItemText primary={primaryText} sx={{ textDecoration: 'none', color: theme.palette.primary.main }} />
      </ListItemButton>
      {/* </Link> */}
    </ListItem>
  )
}
