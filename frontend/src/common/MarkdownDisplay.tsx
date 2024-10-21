import { TypographyProps } from '@mui/material'
import Box from '@mui/material/Box'
import { grey } from '@mui/material/colors'
import Link from '@mui/material/Link'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import ReactMarkdown from 'markdown-to-jsx'
import { useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

export type MarkdownDisplayProps = {
  children: string
}

export default function MarkdownDisplay({ children }: MarkdownDisplayProps) {
  const theme = useTheme()

  const options = useMemo(
    () => ({
      overrides: {
        h1: {
          component: (props: TypographyProps) => (
            <Typography gutterBottom variant='h4' component='h1' sx={{ wordWrap: 'break-word' }} {...props} />
          ),
        },
        h2: {
          component: (props: TypographyProps) => (
            <Typography gutterBottom variant='h5' component='h2' sx={{ wordWrap: 'break-word' }} {...props} />
          ),
        },
        h3: {
          component: (props: TypographyProps) => (
            <Typography gutterBottom variant='h6' component='h2' sx={{ wordWrap: 'break-word' }} {...props} />
          ),
        },
        h4: {
          component: (props: TypographyProps) => (
            <Typography gutterBottom variant='subtitle1' component='h4' sx={{ wordWrap: 'break-word' }} {...props} />
          ),
        },
        p: {
          component: (props: TypographyProps) => (
            <Typography component='p' sx={{ wordWrap: 'break-word' }} {...props} />
          ),
        },
        blockquote: {
          component: (props: any) => (
            <Box
              sx={{
                fontStyle: 'italic',
                background: grey.A200,
                borderLeft: '2px',
                borderLeftStyle: 'solid',
                borderLeftColor: theme.palette.markdownBorder.main,
                pt: 2,
                pl: 1,
                pb: 0.5,
                pr: 1,
                ml: 2,
                mb: 2,
                wordWrap: 'break-word',
              }}
              {...props}
            />
          ),
        },
        span: {
          component: (props: TypographyProps) => (
            <Typography
              component='span'
              style={{
                overflowX: 'auto',
                backgroundColor: theme.palette.container.main,
                wordWrap: 'break-word',
              }}
              {...props}
            />
          ),
        },
        a: {
          component: (props: any) => (
            <Link
              sx={{
                wordWrap: 'break-word',
              }}
              {...props}
            />
          ),
        },
        li: {
          component: (props: any) => (
            <Box component='li' sx={{ mt: 1 }}>
              <Typography component='span' sx={{ wordWrap: 'break-word' }} {...props} />
            </Box>
          ),
        },
        pre: {
          component: (props: any) => (
            <pre
              style={{ overflowX: 'auto', backgroundColor: theme.palette.container.main, wordWrap: 'break-word' }}
              {...props}
            />
          ),
        },
        code: {
          component: ({ children, ...props }: any) => {
            const language = props.className ? props.className.replace('lang-', '') : ''

            return (
              <Box
                component='code'
                sx={{
                  backgroundColor: theme.palette.grey[200],
                  fontFamily: 'monospace',
                }}
                {...props}
              >
                {language ? <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter> : children}
              </Box>
            )
          },
        },
        table: {
          component: (props: any) => (
            <div style={{ overflowX: 'auto' }}>
              <table {...props} />
            </div>
          ),
        },
      },
    }),
    [theme.palette.container.main, theme.palette.grey, theme.palette.markdownBorder.main],
  )

  return <ReactMarkdown options={options}>{children}</ReactMarkdown>
}
