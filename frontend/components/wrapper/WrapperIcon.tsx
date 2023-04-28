import { Badge, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'

import Link from '../../src/Link'

interface Props {
  selected: boolean
  expanded: boolean

  href: string
  title: string

  badge?: number

  children: any
}

export default function WrapperIcon({ selected, expanded, href, title, badge, children }: Props) {
  const badgedIcon = badge ? (
    <Badge badgeContent={badge} color='secondary'>
      {children}
    </Badge>
  ) : (
    children
  )

  return (
    <Link href={href} color='inherit' underline='none'>
      <ListItemButton selected={selected} data-test={`${title}Link`}>
        <ListItemIcon>
          {!expanded ? (
            <Tooltip title={title} arrow placement='right'>
              {badgedIcon}
            </Tooltip>
          ) : (
            children
          )}
        </ListItemIcon>
        <ListItemText primary={title} />
      </ListItemButton>
    </Link>
  )
}
