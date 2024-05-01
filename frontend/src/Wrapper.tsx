import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

import { useGetCurrentUser } from '../actions/user'
import Banner from './Banner'
import Copyright from './Copyright'
import SideNavigation from './wrapper/SideNavigation'
import TopNavigation from './wrapper/TopNavigation'

export type WrapperProps = {
  children?: ReactNode
}

export default function Wrapper({ children }: WrapperProps): ReactElement {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [pageTopStyling, setPageTopStyling] = useState({})
  const [contentTopStyling, setContentTopStyling] = useState({})
  const [errorMessage, setErrorMessage] = useState('')

  const router = useRouter()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const isDocsPage = useMemo(() => router.route.startsWith('/docs'), [router])
  const page = useMemo(() => router.route.split('/')[1].replace('/', ''), [router])

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

  const handleSideNavigationError = useCallback((message: string) => setErrorMessage(message), [])

  const resetErrorMessage = useCallback(() => setErrorMessage(''), [])

  const toggleDrawer = (): void => {
    setOpen(!open)
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
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
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
        </Box>
      </Box>
    </>
  )
}
