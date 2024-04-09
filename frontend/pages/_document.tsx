import { documentGetInitialProps, DocumentHeadTags, DocumentHeadTagsProps } from '@mui/material-nextjs/v13-pagesRouter'
import { DocumentProps, Head, Html, Main, NextScript } from 'next/document'
import createEmotionCache from 'utils/createEmotionCache'

import { lightTheme } from '../src/theme'

export default function MyDocument(props: DocumentProps & DocumentHeadTagsProps) {
  {
    return (
      <Html lang='en'>
        <Head>
          <DocumentHeadTags {...props} />
          {/* PWA primary color */}
          <meta name='theme-color' content={lightTheme.palette.primary.main} />
          <link rel='shortcut icon' href='/favicon.png' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

MyDocument.getInitialProps = async (ctx) => {
  const finalProps = await documentGetInitialProps(ctx, {
    emotionCache: createEmotionCache(),
  })
  return finalProps
}
