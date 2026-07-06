import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'

type InlineDiffProps = {
  from?: string
  to?: string
  markdown?: boolean
}

const removedStyle = {
  backgroundColor: '#ffe1e1',
  color: '#b71c1c',
  padding: '0 4px',
  borderRadius: 2,
  display: 'block',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  width: '100%',
} as const

const addedStyle = {
  backgroundColor: '#e1ffe1',
  color: '#1b5e20',
  padding: '0 4px',
  borderRadius: 2,
  display: 'block',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  width: '100%',
} as const

function renderContent(markdown: boolean, value?: string): ReactNode {
  if (value === undefined || value === '') {
    return (
      <Typography component='span' sx={{ fontStyle: 'italic' }}>
        Unanswered
      </Typography>
    )
  }
  return markdown ? <MarkdownDisplay>{value}</MarkdownDisplay> : <Typography component='span'>{value}</Typography>
}

export default function InlineDiff({ from, to, markdown = false }: InlineDiffProps) {
  if (from === to) {
    return <Box sx={{ wordBreak: 'break-word' }}>{renderContent(markdown, to)}</Box>
  }

  return (
    <Stack spacing={0.5}>
      <Box component='mark' sx={removedStyle}>
        {renderContent(markdown, from)}
      </Box>
      <Box component='mark' sx={addedStyle}>
        {renderContent(markdown, to)}
      </Box>
    </Stack>
  )
}
