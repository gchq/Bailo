import Head from 'next/head'
import { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider, EmotionCache } from '@emotion/react'

import createEmotionCache from '../components/createEmotionCache'

import useThemeMode from '../utils/hooks/useThemeMode'
import ThemeModeContext from '../src/contexts/themeModeContext'

import { SnackbarProvider } from 'notistack'

import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/terminal.css'
import '../public/css/highlight.css'
import 'reactflow/dist/style.css'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  const themeModeValue = useThemeMode()

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={themeModeValue.theme}>
        <ThemeModeContext.Provider value={themeModeValue}>
          <SnackbarProvider>
            <CssBaseline />
            <Component {...pageProps} />
          </SnackbarProvider>
        </ThemeModeContext.Provider>
      </ThemeProvider>
    </CacheProvider>
  )
}
