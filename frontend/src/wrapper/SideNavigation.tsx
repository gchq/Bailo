import {
  AccessibilityNew,
  Equalizer,
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
import PythonIcon from 'src/common/PythonIcon'
import MessageAlert from 'src/MessageAlert'
import { NavMenuItem } from 'src/wrapper/NavMenuItem'
import { ReviewKind, Roles } from 'types/types'

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
    position: 'fixed',
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
          width: '60px',
        },
      },
    },
  ],
}))

export interface SideNavigationProps {
  page: string
  bannerVisible: boolean
  toggleDrawer: () => void
  onError: (errorMessage: string) => void
  onResetErrorMessage: () => void
  drawerOpen?: boolean
  pageTopStyling?: CSSProperties
}

export default function SideNavigation({
  page,
  bannerVisible,
  toggleDrawer,
  onResetErrorMessage,
  drawerOpen = false,
  pageTopStyling = {},
}: SideNavigationProps) {
  const [reviewCount, setReviewCount] = useState(0)
  const {
    reviewCountHeader: releaseReviewCountHeader,
    isReviewsLoading: isReleaseReviewsLoading,
    isReviewsError: isReleaseReviewsError,
  } = useHeadReviewRequestsForUser(true, ReviewKind.RELEASE)
  const {
    reviewCountHeader: accessRequestReviewCountHeader,
    isReviewsLoading: isAccessRequestReviewsLoading,
    isReviewsError: isAccessRequestReviewsError,
  } = useHeadReviewRequestsForUser(true, ReviewKind.ACCESS)
  const { responses, isResponsesLoading, isResponsesError } = useGetUserResponses()

  useEffect(() => {
    async function fetchReviewCount() {
      onResetErrorMessage()
      const releaseCount = releaseReviewCountHeader ?? 0
      const accessCount = accessRequestReviewCountHeader ?? 0
      setReviewCount(releaseCount + accessCount)
    }
    fetchReviewCount()
  }, [accessRequestReviewCountHeader, onResetErrorMessage, releaseReviewCountHeader, responses])

  if (isReleaseReviewsError) {
    return <MessageAlert message={isReleaseReviewsError.info.message} severity='error' />
  }

  if (isAccessRequestReviewsError) {
    return <MessageAlert message={isAccessRequestReviewsError.info.message} severity='error' />
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  return (
    <Drawer sx={pageTopStyling} variant='permanent' open={drawerOpen}>
      {(isReleaseReviewsLoading || isAccessRequestReviewsLoading || isResponsesLoading) && <Loading />}
      <Toolbar
        sx={(theme) => ({
          marginTop: bannerVisible ? 4 : 0,
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      />
      {drawerOpen !== undefined && (
        <Stack
          sx={{
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
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
            {!drawerOpen && <Divider aria-hidden='true' />}
            <NavMenuItem
              href='/api/docs'
              selectedPage={page}
              primaryText='API'
              drawerOpen={drawerOpen}
              menuPage='api'
              title='API'
              icon={<LinkIcon />}
              openLinkInNewTab
            />
            <NavMenuItem
              href='/docs'
              selectedPage={page}
              primaryText='User docs'
              drawerOpen={drawerOpen}
              menuPage='userDocs'
              title='User documentation'
              icon={<DescriptionIcon />}
              openLinkInNewTab
            />
            <NavMenuItem
              href='/docs/python/index.html'
              selectedPage={page}
              primaryText='Python client docs'
              drawerOpen={drawerOpen}
              menuPage='pythonDocs'
              title='Python client docs'
              icon={<PythonIcon />}
              openLinkInNewTab
            />
            <Divider aria-hidden='true' />
            <>
              <NavMenuItem
                href='/schemas/list'
                selectedPage={page}
                primaryText='Schemas'
                drawerOpen={drawerOpen}
                menuPage='schemas'
                title='Schemas'
                icon={<SchemaIcon />}
                requiredRole={Roles.Admin}
              />
            </>
            <NavMenuItem
              href='/reviewRoles/view'
              selectedPage={page}
              primaryText='Review Roles'
              drawerOpen={drawerOpen}
              menuPage='reviewRoles'
              title='Review roles'
              icon={<SupervisorAccount />}
              requiredRole={Roles.Admin}
            />
            <NavMenuItem
              href='/metrics'
              selectedPage={page}
              primaryText='Metrics'
              drawerOpen={drawerOpen}
              menuPage='metrics'
              title='Metrics'
              icon={<Equalizer />}
              requiredRole={Roles.Compliance}
            />
          </StyledList>
          <StyledList>
            <Divider aria-hidden='true' />
            <NavMenuItem
              href='/help'
              selectedPage={page}
              primaryText='Support'
              drawerOpen={drawerOpen}
              menuPage='help'
              title='Help & support'
              icon={<ContactSupportIcon />}
            />
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
