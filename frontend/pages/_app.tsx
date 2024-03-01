import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/highlight.css'

import { CacheProvider, EmotionCache } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'
import { useEffect } from 'react'
import createEmotionCache from 'utils/createEmotionCache'

import ThemeModeContext from '../src/contexts/themeModeContext'
import UnsavedChangesContext from '../src/contexts/unsavedChangesContext'
import useThemeMode from '../src/hooks/useThemeMode'
import useUnsavedChanges from '../src/hooks/useUnsavedChanges'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps) {
  const themeModeValue = useThemeMode()
  const unsavedChangesValue = useUnsavedChanges()

  // This is set so that 'react-markdown-editor' respects the theme set by MUI.
  useEffect(() => {
    const mode = themeModeValue.theme.palette.mode === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-color-mode', mode)
  }, [themeModeValue])

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={themeModeValue.theme}>
        <UnsavedChangesContext.Provider value={unsavedChangesValue}>
          <ThemeModeContext.Provider value={themeModeValue}>
            <SnackbarProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
                <CssBaseline />
                <Component {...pageProps} />
              </LocalizationProvider>
            </SnackbarProvider>
          </ThemeModeContext.Provider>
        </UnsavedChangesContext.Provider>
      </ThemeProvider>
    </CacheProvider>
  )
}
