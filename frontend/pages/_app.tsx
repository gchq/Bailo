import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/highlight.css'

import CssBaseline from '@mui/material/CssBaseline'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'
import { useEffect } from 'react'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import useUserPermissions from 'src/hooks/UserPermissionsHook'
import ThemeWrapper from 'src/ThemeWrapper'
import Wrapper from 'src/Wrapper'

import ThemeModeContext from '../src/contexts/themeModeContext'
import UnsavedChangesContext from '../src/contexts/unsavedChangesContext'
import useThemeMode from '../src/hooks/useThemeMode'
import useUnsavedChanges from '../src/hooks/useUnsavedChanges'

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props
  const themeModeValue = useThemeMode()
  const unsavedChangesValue = useUnsavedChanges()
  const userPermissionsValue = useUserPermissions()

  // This is set so that 'react-markdown-editor' respects the theme set by MUI.
  useEffect(() => {
    // TODO Once v2 is adopted we should re-implement darkmode
    //const mode = themeModeValue.theme.palette.mode === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-color-mode', 'light')
  }, [themeModeValue])

  return (
    <AppCacheProvider {...props}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeModeContext.Provider value={themeModeValue}>
        <UnsavedChangesContext.Provider value={unsavedChangesValue}>
          <ThemeModeContext.Provider value={themeModeValue}>
            <UserPermissionsContext.Provider value={userPermissionsValue}>
              <SnackbarProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
                  <ThemeWrapper>
                    <CssBaseline />
                    <Wrapper>
                      <Component {...pageProps} />
                    </Wrapper>
                  </ThemeWrapper>
                </LocalizationProvider>
              </SnackbarProvider>
            </UserPermissionsContext.Provider>
          </ThemeModeContext.Provider>
        </UnsavedChangesContext.Provider>
      </ThemeModeContext.Provider>
    </AppCacheProvider>
  )
}
