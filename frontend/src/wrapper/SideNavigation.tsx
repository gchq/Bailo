import AdminIcon from '@mui/icons-material/AdminPanelSettings'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LinkIcon from '@mui/icons-material/Link'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SchemaIcon from '@mui/icons-material/Schema'
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
import { useGetReviewRequestsForUser } from 'actions/review'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { Decision, ReviewRequestInterface } from 'types/interfaces'

import { User } from '../../types/v2/types'
import { DRAWER_WIDTH } from '../../utils/constants'
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
  const theme = useTheme()
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()

  const doesNotContainUserApproval = useCallback(
    (review: ReviewRequestInterface) => {
      return (
        currentUser &&
        !review.responses.find(
          (response) => response.user === `user:${currentUser.dn}` && response.decision === Decision.Approve,
        )
      )
    },
    [currentUser],
  )

  useEffect(() => {
    async function fetchReviewCount() {
      onResetErrorMessage()
      if (reviews) {
        setReviewCount(reviews.filter((filteredReview) => doesNotContainUserApproval(filteredReview)).length)
      }
    }
    fetchReviewCount()
  }, [onResetErrorMessage, doesNotContainUserApproval, reviews])

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
              <Link href='/beta/review' color='inherit' underline='none'>
                <ListItemButton selected={page === 'beta/review'} data-test='reviewLink'>
                  <ListItemIcon>
                    {!drawerOpen ? (
                      <Tooltip title='Review' arrow placement='right'>
                        <>
                          {!isReviewsLoading && (
                            <Badge badgeContent={reviewCount} color='secondary' invisible={reviewCount === 0}>
                              <ListAltIcon />
                            </Badge>
                          )}
                        </>
                      </Tooltip>
                    ) : (
                      <>
                        {!isReviewsLoading && (
                          <Badge badgeContent={reviewCount} color='secondary' invisible={reviewCount === 0}>
                            <ListAltIcon />
                          </Badge>
                        )}
                      </>
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
          {/* TODO Once currentUser api has been updated to use roles we should check if they're admin */}
          {currentUser && (
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
                  <Link href='/beta/schemas/list'>
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
