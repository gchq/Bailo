import { CacheProvider, EmotionCache } from '@emotion/react'
import DocsMenuContext from '@/src/contexts/docsMenuContext'
import useDocsMenu from '@/utils/hooks/useDocsMenu'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { ChangeEvent, createContext, useCallback, useEffect, useState } from 'react'
import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/terminal.css'
import '../public/css/highlight.css'
import createEmotionCache from '../src/createEmotionCache'
import { darkTheme, lightTheme } from '../src/theme'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

export const DarkModeContext: any = createContext(null)

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState(
    typeof window !== 'undefined' && localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme
  )
  const docsMenuValue = useDocsMenu()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDarkModeToggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('dark_mode_enabled', `${event.target.checked}`)
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
            <DocsMenuContext.Provider value={docsMenuValue}>
              <CssBaseline />
              <Component {...pageProps} />
            </DocsMenuContext.Provider>
          </DarkModeContext.Provider>
        </ThemeProvider>
      )}
    </CacheProvider>
  )
}
