import * as React from 'react'
import Head from 'next/head'
import { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider, EmotionCache } from '@emotion/react'
import { lightTheme, darkTheme } from '../src/theme'
import createEmotionCache from '../src/createEmotionCache'

import '../public/css/terminal.css'
import '../public/css/layouting.css'
import '../public/css/fonts.css'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

export const DarkModeContext: any = React.createContext(null)

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const [mounted, setMounted] = React.useState<boolean>(false)
  const [theme, setTheme] = React.useState<any>(
    typeof window !== 'undefined' && localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleDarkModeToggle = React.useCallback((event: any) => {
    localStorage.setItem('dark_mode_enabled', event.target.checked)
    setTheme(localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme)
  }, [])

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>Bailo</title>
        <meta name='description' content='Making it easy to compliantly manage the machine learning lifecycle.' />
        <meta name='viewport' content='initial-scale=1, width=device-width' />
        <link rel='shortcut icon' href='/favicon.png' />
      </Head>
      {mounted && (
        <ThemeProvider theme={theme}>
          <DarkModeContext.Provider value={handleDarkModeToggle}>
            <CssBaseline />
            <Component {...pageProps} handleDarkModeToggle={handleDarkModeToggle} />
          </DarkModeContext.Provider>
        </ThemeProvider>
      )}
    </CacheProvider>
  )
}
