import {
  createEmotionCache,
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from '@mui/material-nextjs/v15-pagesRouter'
import { DocumentProps, Head, Html, Main, NextScript } from 'next/document'

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
          {/* Set the markdown editor colour mode before hydration to avoid a flash of the wrong theme. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var d = localStorage.getItem('dark_mode_enabled') === 'true';
                  document.documentElement.setAttribute('data-color-mode', d ? 'dark' : 'light');
                } catch (e) {}
              `,
            }}
          />
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
    emotionCache: createEmotionCache({ key: 'css' }),
  })
  return finalProps
}
