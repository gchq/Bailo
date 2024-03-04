import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/highlight.css'

import { CacheProvider, EmotionCache } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { Theme, ThemeProvider } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useGetCurrentUserSettings } from 'actions/user'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import { themeList } from 'src/theme'
import createEmotionCache from 'utils/createEmotionCache'

import UnsavedChangesContext from '../src/contexts/unsavedChangesContext'
import useUnsavedChanges from '../src/hooks/useUnsavedChanges'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps) {
  const { userSettings, isUserSettingsLoading } = useGetCurrentUserSettings()
  const [theme, setTheme] = useState<Theme | undefined>(undefined)
  const unsavedChangesValue = useUnsavedChanges()

  // This is set so that 'react-markdown-editor' respects the theme set by MUI.
  useEffect(() => {
    if (!isUserSettingsLoading && userSettings) {
      const theme = themeList.find((e) => e.key === userSettings?.theme)
      if (theme) {
        const mode = theme.theme.palette.mode === 'dark' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-color-mode', mode)
        setTheme(theme.theme)
      }
    }
  }, [userSettings, isUserSettingsLoading])

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      {theme && (
        <ThemeProvider theme={theme}>
          <UnsavedChangesContext.Provider value={unsavedChangesValue}>
            <SnackbarProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
                <CssBaseline />
                <Component {...pageProps} />
              </LocalizationProvider>
            </SnackbarProvider>
          </UnsavedChangesContext.Provider>
        </ThemeProvider>
      )}
    </CacheProvider>
  )
}
