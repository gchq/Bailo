import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { useGetUiConfig } from 'actions/uiConfig'
import cookies from 'js-cookie'
import { useRouter } from 'next/router'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Announcement from 'src/Announcement'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { DISMISSED_COOKIE_NAME } from 'utils/constants'

import { useGetCurrentUser } from '../actions/user'
import Banner from './Banner'
import Copyright from './Copyright'
import SideNavigation from './wrapper/SideNavigation'
import TopNavigation from './wrapper/TopNavigation'

export type WrapperProps = {
  children?: ReactNode
}

export default function Wrapper({ children }: WrapperProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [pageTopStyling, setPageTopStyling] = useState({})
  const [contentTopStyling, setContentTopStyling] = useState({})
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const isDocsPage = useMemo(() => router.route.startsWith('/docs'), [router])
  const page = useMemo(() => router.route.split('/')[1].replace('/', ''), [router])

  const dismissedTimestamp = cookies.get(DISMISSED_COOKIE_NAME)
  const [annoucementBannerOpen, setAnnouncementBannerOpen] = useState(false)

  useEffect(() => {
    if (!isUiConfigLoading) {
      if (uiConfig && uiConfig.banner.enabled) {
        setPageTopStyling({
          mt: 4,
        })
        setContentTopStyling({
          mt: isDocsPage ? 4 : 8,
        })
      }
    }
  }, [isUiConfigLoading, uiConfig, isDocsPage])

  useEffect(() => {
    if (uiConfig) {
      setAnnouncementBannerOpen(
        uiConfig.announcement.enabled &&
          (!dismissedTimestamp || new Date(dismissedTimestamp) < new Date(uiConfig.announcement.startTimestamp)),
      )
    }
  }, [dismissedTimestamp, uiConfig])

  const handleSideNavigationError = useCallback((message: string) => setErrorMessage(message), [])

  const resetErrorMessage = useCallback(() => setErrorMessage(''), [])

  const toggleDrawer = (): void => {
    setOpen(!open)
  }

  const handleAnnouncementOnClose = () => {
    setAnnouncementBannerOpen(false)
    cookies.set(DISMISSED_COOKIE_NAME, new Date().toISOString())
  }

  if (isUiConfigError) {
    if (isUiConfigError.status === 403) {
      return <MessageAlert message='Error authenticating user.' severity='error' />
    }

    return <MessageAlert message={`Error loading UI Config: ${isUiConfigError.info.message}`} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      <Banner />
      <Box sx={{ display: 'flex' }}>
        {!isUiConfigLoading && uiConfig && uiConfig.banner.enabled && <Box sx={{ mt: 20 }} />}
        {currentUser && (
          <>
            <TopNavigation drawerOpen={open} pageTopStyling={pageTopStyling} currentUser={currentUser} />
            <SideNavigation
              page={page}
              currentUser={currentUser}
              drawerOpen={open}
              pageTopStyling={pageTopStyling}
              toggleDrawer={toggleDrawer}
              onError={handleSideNavigationError}
              onResetErrorMessage={resetErrorMessage}
            />
          </>
        )}
        <Box
          component='main'
          sx={(theme) => ({
            // TODO Set this for dark mode only in the future
            backgroundColor: theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
            ...theme.applyStyles('light', {
              backgroundColor: theme.palette.grey[100],
            }),
          })}
        >
          <Toolbar />
          <Box sx={contentTopStyling}>
            {isDocsPage ? (
              children
            ) : (
              <>
                {isCurrentUserLoading && <Loading />}
                <MessageAlert message={errorMessage} severity='error' />
                {children}
                <Copyright sx={{ mb: 2 }} />
              </>
            )}
          </Box>
          {isUiConfigLoading && <Loading />}
          {uiConfig && annoucementBannerOpen && (
            <Announcement message={uiConfig.announcement.text} onClose={handleAnnouncementOnClose} />
          )}
        </Box>
      </Box>
    </>
  )
}
