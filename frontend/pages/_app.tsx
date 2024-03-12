import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/highlight.css'

import { CacheProvider, EmotionCache } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'
import ThemeModeContext from 'src/contexts/themeModeContext'
import useThemeMode from 'src/hooks/useThemeMode'
import ThemeWrapper from 'src/ThemeWrapper'
import createEmotionCache from 'utils/createEmotionCache'

import UnsavedChangesContext from '../src/contexts/unsavedChangesContext'
import useUnsavedChanges from '../src/hooks/useUnsavedChanges'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps) {
  const unsavedChangesValue = useUnsavedChanges()
  const themeModeValue = useThemeMode()

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <UnsavedChangesContext.Provider value={unsavedChangesValue}>
        <ThemeModeContext.Provider value={themeModeValue}>
          <SnackbarProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
              <ThemeWrapper>
                <CssBaseline />
                <Component {...pageProps} />
              </ThemeWrapper>
            </LocalizationProvider>
          </SnackbarProvider>
        </ThemeModeContext.Provider>
      </UnsavedChangesContext.Provider>
    </CacheProvider>
  )
}
