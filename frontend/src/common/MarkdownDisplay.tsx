import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import ReactMarkdown from 'markdown-to-jsx'
import { useMemo } from 'react'

export type MarkdownDisplayProps = {
  children: string
}

export default function MarkdownDisplay({ children }: MarkdownDisplayProps) {
  const theme = useTheme()

  const options = useMemo(
    () => ({
      overrides: {
        h1: {
          component: Typography,
          props: {
            gutterBottom: true,
            variant: 'h4',
          },
        },
        h2: {
          component: Typography,
          props: { gutterBottom: true, variant: 'h6' },
        },
        h3: {
          component: Typography,
          props: { gutterBottom: true, variant: 'subtitle1' },
        },
        h4: {
          component: Typography,
          props: {
            gutterBottom: true,
            variant: 'caption',
            paragraph: true,
          },
        },
        p: {
          component: Typography,
          props: { paragraph: true },
        },
        a: { component: Link },
        li: {
          component: (props: any) => (
            <Box component='li' sx={{ mt: 1 }}>
              <Typography component='span' {...props} />
            </Box>
          ),
        },
        pre: {
          component: (props: any) => (
            <pre style={{ overflowX: 'auto', backgroundColor: theme.palette.container.main }} {...props} />
          ),
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
    [theme.palette.container.main],
  )

  return <ReactMarkdown options={options}>{children}</ReactMarkdown>
}
