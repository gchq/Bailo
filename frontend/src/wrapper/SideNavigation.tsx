import AdminIcon from '@mui/icons-material/AdminPanelSettings'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LinkIcon from '@mui/icons-material/Link'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SchemaIcon from '@mui/icons-material/Schema'
import ViewList from '@mui/icons-material/ViewList'
import {
  Badge,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
} from '@mui/material'
import MuiDrawer from '@mui/material/Drawer'
import { styled, useTheme } from '@mui/material/styles'
import { CSSProperties, useEffect, useState } from 'react'

import { getReviewCount } from '../../actions/review'
import { User } from '../../types/types'
import { DRAWER_WIDTH } from '../../utils/constants'
import useNotification from '../common/Snackbar'
import Link from '../Link'

const StyledList = styled(List)(({ theme }) => ({
  paddingTop: 0,
  paddingBottom: 0,
  '&, & .MuiListItemIcon-root': {
    color: theme.palette.primary.main,
  },
  '&& .Mui-selected, && .Mui-selected:hover': {
    '&, & .MuiListItemIcon-root': {
      color: theme.palette.secondary.main,
    },
  },
}))

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: DRAWER_WIDTH,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}))

interface SideNavigationProps {
  page: string
  drawerOpen?: boolean
  pageTopStyling?: CSSProperties
  toggleDrawer: () => void
  currentUser: User
}

// This is currently only being used by the beta wrapper
export default function SideNavigation({
  page,
  drawerOpen = false,
  pageTopStyling = {},
  toggleDrawer,
  currentUser,
}: SideNavigationProps) {
  const [reviewCount, setReviewCount] = useState(0)

  const sendNotification = useNotification()

  const theme = useTheme()

  // We should add some error handling here, such as an error message appearing in a snackbar
  // Additional error messages should be added for screen-readers
  useEffect(() => {
    async function fetchReviewCount() {
      const response = (await getReviewCount()).headers.get('x-count')
      if (response === null) {
        sendNotification({
          variant: 'error',
          msg: 'Response was null, number expected',
          anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
        })
        setReviewCount(0)
        return
      }

      setReviewCount(parseInt(response))
    }
    fetchReviewCount()
  }, [sendNotification])

  return (
    <Drawer sx={pageTopStyling} variant='permanent' open={drawerOpen}>
      <Toolbar
        sx={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <IconButton aria-label='close drawer' onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      {drawerOpen !== undefined && (
        <>
          <StyledList>
            <ListItem disablePadding>
              <Link href='/beta' color='inherit' underline='none'>
                <ListItemButton selected={page === 'marketplace' || page === 'model' || page === 'deployment'}>
                  <ListItemIcon>
                    {!drawerOpen ? (
                      <Tooltip title='Marketplace' arrow placement='right'>
                        <DashboardIcon />
                      </Tooltip>
                    ) : (
                      <DashboardIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText primary='Marketplace' />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton disabled selected={page === 'deployments'}>
                <ListItemIcon>
                  {!drawerOpen ? (
                    <Tooltip title='My Access Requests' arrow placement='right'>
                      <ViewList />
                    </Tooltip>
                  ) : (
                    <ViewList />
                  )}
                </ListItemIcon>
                <ListItemText primary='Deployments' />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <Link href='/beta/review' color='inherit' underline='none'>
                <ListItemButton selected={page === 'beta/review'} data-test='reviewLink'>
                  <ListItemIcon>
                    {!drawerOpen ? (
                      <Tooltip title='Review' arrow placement='right'>
                        <Badge badgeContent={reviewCount} color='secondary' invisible={reviewCount === 0}>
                          <ListAltIcon />
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Badge badgeContent={reviewCount} color='secondary' invisible={reviewCount === 0}>
                        <ListAltIcon />
                      </Badge>
                    )}
                  </ListItemIcon>
                  <ListItemText primary='Reviews' />
                </ListItemButton>
              </Link>
            </ListItem>
          </StyledList>
          <Divider />
          <StyledList>
            <ListItem disablePadding>
              <Link href='/beta/docs/api'>
                <ListItemButton selected={page === 'api'} data-test='apiDocsLink'>
                  <ListItemIcon>
                    {!drawerOpen ? (
                      <Tooltip title='API' arrow placement='right'>
                        <LinkIcon />
                      </Tooltip>
                    ) : (
                      <LinkIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText primary='API' />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem disablePadding>
              <Link href='/beta/help'>
                <ListItemButton selected={page === 'help'} data-test='supportLink'>
                  <ListItemIcon>
                    {!drawerOpen ? (
                      <Tooltip title='Help & Support' arrow placement='right'>
                        <ContactSupportIcon />
                      </Tooltip>
                    ) : (
                      <ContactSupportIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText primary='Support' />
                </ListItemButton>
              </Link>
            </ListItem>
          </StyledList>
          {currentUser && currentUser.roles.includes('admin') && (
            <>
              <Divider />
              <StyledList>
                <ListItem disablePadding>
                  <Link href='/admin'>
                    <ListItemButton selected={page === 'admin'}>
                      <ListItemIcon data-test='adminLink'>
                        {!drawerOpen ? (
                          <Tooltip arrow title='Admin' placement='right'>
                            <AdminIcon />
                          </Tooltip>
                        ) : (
                          <AdminIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText primary='Admin' />
                    </ListItemButton>
                  </Link>
                </ListItem>
                <ListItem disablePadding>
                  <Link href='/schemas'>
                    <ListItemButton selected={page === 'schemas'}>
                      <ListItemIcon data-test='designSchemaLink'>
                        {!drawerOpen ? (
                          <Tooltip arrow title='Schemas' placement='right'>
                            <SchemaIcon />
                          </Tooltip>
                        ) : (
                          <SchemaIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText primary='Schemas' />
                    </ListItemButton>
                    {drawerOpen}
                  </Link>
                </ListItem>
              </StyledList>
            </>
          )}
        </>
      )}
      <Divider />
    </Drawer>
  )
}
