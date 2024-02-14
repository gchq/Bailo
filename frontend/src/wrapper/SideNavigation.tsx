import { KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight, Settings as SettingsIcon } from '@mui/icons-material'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LinkIcon from '@mui/icons-material/Link'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SchemaIcon from '@mui/icons-material/Schema'
import { Divider, List, ListItem, ListItemButton, ListItemIcon, Stack, Toolbar } from '@mui/material'
import MuiDrawer from '@mui/material/Drawer'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import { useGetReviewRequestsForUser } from 'actions/review'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { NavMenuItem } from 'src/wrapper/NavMenuItem'
import { ReviewRequestInterface, User } from 'types/types'

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

export interface SideNavigationProps {
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
  onResetErrorMessage,
  drawerOpen = false,
  pageTopStyling = {},
}: SideNavigationProps) {
  const [reviewCount, setReviewCount] = useState(0)
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()

  const theme = useTheme()

  const doesNotContainUserResponse = useCallback(
    (review: ReviewRequestInterface) => {
      return currentUser && !review.responses.find((response) => response.user === `user:${currentUser.dn}`)
    },
    [currentUser],
  )

  useEffect(() => {
    async function fetchReviewCount() {
      onResetErrorMessage()
      if (reviews) {
        setReviewCount(reviews.filter((filteredReview) => doesNotContainUserResponse(filteredReview)).length)
      }
    }
    fetchReviewCount()
  }, [onResetErrorMessage, doesNotContainUserResponse, reviews])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <Drawer sx={pageTopStyling} variant='permanent' open={drawerOpen}>
      {isReviewsLoading && <Loading />}
      <Toolbar
        sx={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      />
      {drawerOpen !== undefined && (
        <Stack sx={{ height: '100%' }} justifyContent='space-between'>
          <StyledList>
            <NavMenuItem
              href='/'
              selectedPage={page}
              primaryText='Marketplace'
              drawerOpen={drawerOpen}
              menuPage='marketplace'
              title='Marketplace'
              icon={<DashboardIcon />}
            />
            <NavMenuItem
              href='/review'
              selectedPage={page}
              primaryText='Reviews'
              drawerOpen={drawerOpen}
              menuPage='review'
              title='Review'
              icon={<ListAltIcon />}
              badgeCount={reviewCount}
            />
            <Divider />
            <NavMenuItem
              href='/docs/api'
              selectedPage={page}
              primaryText='API'
              drawerOpen={drawerOpen}
              menuPage='api'
              title='API'
              icon={<LinkIcon />}
            />
            <NavMenuItem
              href='/help'
              selectedPage={page}
              primaryText='Support'
              drawerOpen={drawerOpen}
              menuPage='help'
              title='Help & Support'
              icon={<ContactSupportIcon />}
            />
            <Divider />
            {/* TODO Once currentUser api has been updated to use roles we should check if they're admin */}
            {currentUser && (
              <>
                <NavMenuItem
                  href='/schemas/list'
                  selectedPage={page}
                  primaryText='Schemas'
                  drawerOpen={drawerOpen}
                  menuPage='schemas'
                  title='Schemas'
                  icon={<SchemaIcon />}
                />
                <Divider />
              </>
            )}
          </StyledList>
          <StyledList>
            <Divider />
            <NavMenuItem
              href='/settings'
              selectedPage={page}
              primaryText='Settings'
              drawerOpen={drawerOpen}
              menuPage='settings'
              title='User settings'
              icon={<SettingsIcon />}
            />
            <Divider />
            <ListItem disablePadding>
              <ListItemButton onClick={toggleDrawer} sx={{ py: 2 }}>
                <ListItemIcon>{drawerOpen ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />}</ListItemIcon>
              </ListItemButton>
            </ListItem>
          </StyledList>
        </Stack>
      )}
    </Drawer>
  )
}
