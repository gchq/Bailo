import { Badge, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactElement, useContext } from 'react'
import CurrentUserContext from 'src/contexts/currentUserContext'
import Link from 'src/Link'
import { RoleKeys } from 'types/types'

interface NavMenuItemProps {
  menuPage: string
  selectedPage: string
  drawerOpen: boolean
  href: string
  icon: ReactElement
  primaryText: string
  title: string
  badgeCount?: number
  openLinkInNewTab?: boolean
  requiredRole?: RoleKeys
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
  openLinkInNewTab = false,
  requiredRole,
}: NavMenuItemProps) {
  const currentUser = useContext(CurrentUserContext)
  const theme = useTheme()
  if (requiredRole && !currentUser.systemRoles.includes(requiredRole)) {
    return
  }
  return (
    <ListItem disablePadding>
      <Link href={href} newTab={openLinkInNewTab} style={{ width: '100%', textDecoration: 'none' }}>
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
          <ListItemText primary={primaryText} sx={{ textDecoration: 'none', color: theme.palette.primary.main }} />
        </ListItemButton>
      </Link>
    </ListItem>
  )
}
