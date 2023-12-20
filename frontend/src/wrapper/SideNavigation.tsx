import { KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from '@mui/icons-material'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LinkIcon from '@mui/icons-material/Link'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SchemaIcon from '@mui/icons-material/Schema'
import { Divider, IconButton, List, MenuItem, Stack, Toolbar } from '@mui/material'
import MuiDrawer from '@mui/material/Drawer'
import { styled, useTheme } from '@mui/material/styles'
import { CSSProperties, useEffect, useState } from 'react'
import { NavMenuItem } from 'src/wrapper/NavMenuItem'
import { getErrorMessage } from 'utils/fetcher'

import { getReviewCount } from '../../actions/review'
import { User } from '../../types/v2/types'
import { DRAWER_WIDTH } from '../../utils/constants'

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
  currentUser: User
  toggleDrawer: () => void
  onError: (errorMessage: string) => void
  onResetErrorMessage: () => void
  drawerOpen?: boolean
  pageTopStyling?: CSSProperties
}

// This is currently only being used by the beta wrapper
export default function SideNavigation({
  page,
  currentUser,
  toggleDrawer,
  onError,
  onResetErrorMessage,
  drawerOpen = false,
  pageTopStyling = {},
}: SideNavigationProps) {
  const [reviewCount, setReviewCount] = useState(0)
  const theme = useTheme()

  useEffect(() => {
    async function fetchReviewCount() {
      onResetErrorMessage()
      const response = await getReviewCount()

      if (!response.ok) {
        onError(await getErrorMessage(response))
        setReviewCount(0)
        return
      }

      const count = response.headers.get('x-count')
      if (count === null) {
        onError('Review count was null, expected a number')
        setReviewCount(0)
        return
      }

      setReviewCount(parseInt(count))
    }
    fetchReviewCount()
  }, [onError, onResetErrorMessage])

  return (
    <Drawer sx={pageTopStyling} variant='permanent' open={drawerOpen}>
      <Toolbar
        sx={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      ></Toolbar>
      {drawerOpen !== undefined && (
        <Stack sx={{ height: '100%' }} justifyContent='space-between'>
          <StyledList>
            <NavMenuItem
              href='/beta'
              selectedPage={page}
              primaryText='Marketplace'
              drawerOpen={drawerOpen}
              menuPage='marketplace'
              title='Marketplace'
              icon={<DashboardIcon />}
            />
            <NavMenuItem
              href='/beta/review'
              selectedPage={page}
              primaryText='Reviews'
              drawerOpen={drawerOpen}
              menuPage='beta/review'
              title='Review'
              icon={<ListAltIcon />}
              badgeCount={reviewCount}
            />
            <Divider />
            <NavMenuItem
              href='/beta/docs/api'
              selectedPage={page}
              primaryText='API'
              drawerOpen={drawerOpen}
              menuPage='beta/api'
              title='API'
              icon={<LinkIcon />}
            />
            <NavMenuItem
              href='/beta/help'
              selectedPage={page}
              primaryText='Support'
              drawerOpen={drawerOpen}
              menuPage='beta/help'
              title='Help & Support'
              icon={<ContactSupportIcon />}
            />
            <Divider />
            {/* TODO Once currentUser api has been updated to use roles we should check if they're admin */}
            {currentUser && (
              <>
                <NavMenuItem
                  href='/beta/schema/list'
                  selectedPage={page}
                  primaryText='Schemas'
                  drawerOpen={drawerOpen}
                  menuPage='beta/schemas'
                  title='Schemas'
                  icon={<SchemaIcon />}
                />
                <Divider />
              </>
            )}
          </StyledList>
          <StyledList>
            <Divider />
            <MenuItem>
              <IconButton
                edge='start'
                color='inherit'
                aria-label='open drawer'
                onClick={toggleDrawer}
                sx={{
                  marginRight: 2,
                }}
              >
                {drawerOpen ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />}
              </IconButton>
            </MenuItem>
          </StyledList>
        </Stack>
      )}
    </Drawer>
  )
}
