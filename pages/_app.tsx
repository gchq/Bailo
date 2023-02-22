import { CacheProvider, EmotionCache } from '@emotion/react'
import ThemeModeContext from '@/src/contexts/themeModeContext'
import DocsMenuContext from '@/src/contexts/docsMenuContext'
import useThemeMode from '@/utils/hooks/useThemeMode'
import useDocsMenu from '@/utils/hooks/useDocsMenu'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/terminal.css'
import '../public/css/highlight.css'
import 'reactflow/dist/style.css'
import { SnackbarProvider } from 'notistack'
import createEmotionCache from '../src/createEmotionCache'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const [mounted, setMounted] = useState(false)
  const themeModeValue = useThemeMode()
  const docsMenuValue = useDocsMenu()

  useEffect(() => {
    setMounted(true)
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
        <ThemeProvider theme={themeModeValue.theme}>
          <ThemeModeContext.Provider value={themeModeValue}>
            <SnackbarProvider>
              <DocsMenuContext.Provider value={docsMenuValue}>
                <CssBaseline />
                <Component {...pageProps} />
              </DocsMenuContext.Provider>
            </SnackbarProvider>
          </ThemeModeContext.Provider>
        </ThemeProvider>
      )}
    </CacheProvider>
  )
}
