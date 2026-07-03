import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useGetArtefactScannerInfo } from 'actions/artefactScanning'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUserV3 } from 'actions/user'
import { ReactNode, useEffect } from 'react'
import Loading from 'src/common/Loading'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import UiConfigContext from 'src/contexts/uiConfigContext'
import useUserPermissions from 'src/hooks/UserPermissionsHook'
import MessageAlert from 'src/MessageAlert'

import useThemeMode from '../hooks/useThemeMode'
import useUnsavedChanges from '../hooks/useUnsavedChanges'
import CurrentUserContext from './currentUserContext'
import ThemeModeContext from './themeModeContext'
import UnsavedChangesContext from './unsavedChangesContext'
import UserPermissionsContext from './userPermissionsContext'

type AppContextProviderProps = {
  children: ReactNode
}

export default function AppContextProvider({ children }: AppContextProviderProps) {
  const themeModeValue = useThemeMode()
  const unsavedChangesValue = useUnsavedChanges()
  const userPermissionsValue = useUserPermissions()
  const { scanners, isScannersError, isScannersLoading } = useGetArtefactScannerInfo()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const {
    currentUser: currentUserV3,
    isCurrentUserLoading: isCurrentUserV3Loading,
    isCurrentUserError: isCurrentUserV3Error,
  } = useGetCurrentUserV3()

  // This is set so that 'react-markdown-editor' respects the theme set by MUI.
  useEffect(() => {
    // TODO Once v2 is adopted we should re-implement darkmode
    //const mode = themeModeValue.theme.palette.mode === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-color-mode', 'light')
  }, [themeModeValue])

  const content = () => {
    if (isCurrentUserV3Error) {
      return <MessageAlert message={isCurrentUserV3Error.info.message} severity='error' />
    }

    if (isUiConfigError) {
      if (isUiConfigError.status === 403) {
        return <MessageAlert message='Error authenticating user.' severity='error' />
      }

      return <MessageAlert message={`Error loading UI Config: ${isUiConfigError.info.message}`} severity='error' />
    }

    if (isScannersError) {
      return <MessageAlert message={isScannersError.info.message} severity='error' />
    }

    if (isCurrentUserV3Loading || !currentUserV3 || isScannersLoading || isUiConfigLoading) {
      return <Loading />
    }

    return (
      <UiConfigContext.Provider value={uiConfig}>
        <ArtefactScanningInfoContext.Provider value={scanners}>
          <ThemeModeContext.Provider value={themeModeValue}>
            <UnsavedChangesContext.Provider value={unsavedChangesValue}>
              <UserPermissionsContext.Provider value={userPermissionsValue}>
                <CurrentUserContext.Provider value={currentUserV3}>{children}</CurrentUserContext.Provider>
              </UserPermissionsContext.Provider>
            </UnsavedChangesContext.Provider>
          </ThemeModeContext.Provider>
        </ArtefactScanningInfoContext.Provider>
      </UiConfigContext.Provider>
    )
  }

  return (
    <ThemeProvider theme={themeModeValue.theme}>
      <CssBaseline />
      {content()}
    </ThemeProvider>
  )
}
