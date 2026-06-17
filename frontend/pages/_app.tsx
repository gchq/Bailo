import '../public/css/fonts.css'
import '../public/css/layouting.css'
import '../public/css/table.css'
import '../public/css/highlight.css'
import '@dayjs'

import { EmotionCache } from '@emotion/cache'
import { AppCacheProvider, createEmotionCache } from '@mui/material-nextjs/v15-pagesRouter'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SnackbarProvider } from 'notistack'
import AppContextProvider from 'src/contexts/AppContextProvider'
import Wrapper from 'src/Wrapper'

const clientCache = createEmotionCache({ key: 'css' })

export default function MyApp(props: AppProps, emotionCache: EmotionCache = clientCache) {
  const { Component, pageProps } = props

  return (
    <AppCacheProvider {...props} emotionCache={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <SnackbarProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
          <AppContextProvider>
            <Wrapper>
              <Component {...pageProps} />
            </Wrapper>
          </AppContextProvider>
        </LocalizationProvider>
      </SnackbarProvider>
    </AppCacheProvider>
  )
}
