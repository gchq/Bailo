import {
  AccessibilityNew,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  SupervisorAccount,
} from '@mui/icons-material'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DescriptionIcon from '@mui/icons-material/Description'
import LinkIcon from '@mui/icons-material/Link'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SchemaIcon from '@mui/icons-material/Schema'
import { Divider, List, ListItem, ListItemButton, ListItemIcon, Stack, Toolbar } from '@mui/material'
import MuiDrawer from '@mui/material/Drawer'
import { styled } from '@mui/material/styles'
import { useGetUserResponses } from 'actions/response'
import { useHeadReviewRequestsForUser } from 'actions/review'
import { CSSProperties, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { NavMenuItem } from 'src/wrapper/NavMenuItem'
import { User } from 'types/types'

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

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: '230px',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
  },
  variants: [
    {
      props: ({ open }) => !open,
      style: {
        '& .MuiDrawer-paper': {
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          width: theme.spacing(7),
          [theme.breakpoints.up('sm')]: {
            width: '60px',
          },
        },
      },
    },
  ],
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

export default function SideNavigation({
  page,
  currentUser,
  toggleDrawer,
  onResetErrorMessage,
  drawerOpen = false,
  pageTopStyling = {},
}: SideNavigationProps) {
  const [reviewCount, setReviewCount] = useState(0)
  const { reviewCountHeader, isReviewsLoading, isReviewsError } = useHeadReviewRequestsForUser(true)
  const { responses, isResponsesLoading, isResponsesError } = useGetUserResponses()

  useEffect(() => {
    async function fetchReviewCount() {
      onResetErrorMessage()
      if (reviewCountHeader) {
        setReviewCount(reviewCountHeader)
      }
    }
    fetchReviewCount()
  }, [onResetErrorMessage, responses, currentUser.dn, reviewCountHeader])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  return (
    <Drawer sx={pageTopStyling} variant='permanent' open={drawerOpen}>
      {(isReviewsLoading || isResponsesLoading) && <Loading />}
      <Toolbar
        sx={(theme) => ({
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      />
      {drawerOpen !== undefined && (
        <Stack sx={{ height: '100%' }} justifyContent='space-between'>
          <StyledList>
            <NavMenuItem
              href='/'
              selectedPage={page}
              primaryText='Marketplace'
              drawerOpen={drawerOpen}
              menuPage=''
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
            <Divider aria-hidden='true' />
            <NavMenuItem
              href='/api/v2/docs'
              selectedPage={page}
              primaryText='API'
              drawerOpen={drawerOpen}
              menuPage='api'
              title='API'
              icon={<LinkIcon />}
              openLinkInNewTab
            />
            <NavMenuItem
              href='/docs/python/index.html'
              selectedPage={page}
              primaryText='Python Client Docs'
              drawerOpen={drawerOpen}
              menuPage='pythonDocs'
              title='Python Client Docs'
              icon={<DescriptionIcon />}
              openLinkInNewTab
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
            <Divider aria-hidden='true' />
            {currentUser.isAdmin && (
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
              </>
            )}
            {currentUser.isAdmin && (
              <NavMenuItem
                href='/reviewRoles/view'
                selectedPage={page}
                primaryText='Review Roles'
                drawerOpen={drawerOpen}
                menuPage='reviewRoles'
                title='Review Roles'
                icon={<SupervisorAccount />}
              />
            )}
          </StyledList>
          <StyledList>
            <Divider aria-hidden='true' />
            <NavMenuItem
              href='/accessibility/statement'
              selectedPage={page}
              primaryText='Accessibility'
              drawerOpen={drawerOpen}
              menuPage='accessibility'
              title='Accessibility'
              icon={<AccessibilityNew />}
            />
            <Divider aria-hidden='true' />
            <ListItem disablePadding>
              <ListItemButton aria-label='toggle side drawer expansion' onClick={toggleDrawer} sx={{ py: 2 }}>
                <ListItemIcon>{drawerOpen ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />}</ListItemIcon>
              </ListItemButton>
            </ListItem>
          </StyledList>
        </Stack>
      )}
    </Drawer>
  )
}
