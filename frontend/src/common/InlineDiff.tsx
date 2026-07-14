import { Box, Stack, Typography } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { ResponsiveStyleValue } from '@mui/system'
import { ReactNode } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'

type InlineDiffProps = {
  from?: string | ReactNode
  to?: string | ReactNode
  markdown?: boolean
  direction?: ResponsiveStyleValue<'row' | 'row-reverse' | 'column' | 'column-reverse'> | undefined
}

const removedStyle = {
  backgroundColor: '#ffe1e1',
  color: '#b71c1c',
  padding: '0 4px',
  borderRadius: 2,
  display: 'block',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} as const

const addedStyle = {
  backgroundColor: '#e1ffe1',
  color: '#1b5e20',
  padding: '0 4px',
  borderRadius: 2,
  display: 'block',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} as const

export function isDiffEmpty(from?: string, to?: string): boolean {
  return (from === undefined || from === '') && (to === undefined || to === '')
}

function renderContent(theme: Theme, markdown: boolean, value?: string | ReactNode): ReactNode {
  if (value === undefined || value === '') {
    return (
      <Typography component='span' sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
        Unanswered
      </Typography>
    )
  }
  if (typeof value !== 'string') {
    return value
  }
  return markdown ? <MarkdownDisplay>{value}</MarkdownDisplay> : <Typography component='span'>{value}</Typography>
}

export default function InlineDiff({ from, to, markdown = false, direction = undefined }: InlineDiffProps) {
  const theme = useTheme()
  if (from === to) {
    return <Box sx={{ wordBreak: 'break-word' }}>{renderContent(theme, markdown, to)}</Box>
  }

  return (
    <Stack direction={direction} spacing={0.5}>
      <Box component='mark' sx={removedStyle}>
        {renderContent(theme, markdown, from)}
      </Box>
      <Box component='mark' sx={addedStyle}>
        {renderContent(theme, markdown, to)}
      </Box>
    </Stack>
  )
}
