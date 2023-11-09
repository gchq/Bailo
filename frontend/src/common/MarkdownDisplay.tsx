import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import ReactMarkdown from 'markdown-to-jsx'

const options = {
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
  },
}

type MarkdownDisplayProps = {
  children: string
}

export default function MarkdownDisplay({ children }: MarkdownDisplayProps) {
  return <ReactMarkdown options={options}>{children}</ReactMarkdown>
}
