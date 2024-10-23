import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/highlight.css'

import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'
import { useEffect } from 'react'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import useUserPermissions from 'src/hooks/UserPermissionsHook'
import Wrapper from 'src/Wrapper'

import ThemeModeContext from '../src/contexts/themeModeContext'
import UnsavedChangesContext from '../src/contexts/unsavedChangesContext'
import useThemeMode from '../src/hooks/useThemeMode'
import useUnsavedChanges from '../src/hooks/useUnsavedChanges'

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props
  const themeModeValue = useThemeMode()
  const unsavedChangesValue = useUnsavedChanges()
  const userPermissions = useUserPermissions()

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
      <ThemeProvider theme={themeModeValue.theme}>
        <UnsavedChangesContext.Provider value={unsavedChangesValue}>
          <ThemeModeContext.Provider value={themeModeValue}>
            <UserPermissionsContext.Provider value={userPermissions}>
              <SnackbarProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
                  <CssBaseline />
                  <Wrapper>
                    <Component {...pageProps} />
                  </Wrapper>
                </LocalizationProvider>
              </SnackbarProvider>
            </UserPermissionsContext.Provider>
          </ThemeModeContext.Provider>
        </UnsavedChangesContext.Provider>
      </ThemeProvider>
    </AppCacheProvider>
  )
}
