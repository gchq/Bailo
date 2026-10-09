import { Typography } from '@mui/material'
import { useMemo } from 'react'
import { diffText } from 'src/common/InlineDiff/diffEngine'
import { DiffChunks, WholeValueDiff } from 'src/common/InlineDiff/DiffMark'

export type InlineTypographyDiffProps = {
  from?: string
  to?: string
}

function renderText(value: string) {
  return <Typography component='span'>{value}</Typography>
}

export default function InlineTypographyDiff({ from = '', to = '' }: InlineTypographyDiffProps) {
  const chunks = useMemo(() => (from && to && from !== to ? diffText(from, to) : undefined), [from, to])

  if (!chunks) {
    return <WholeValueDiff from={from} to={to} render={renderText} />
  }

  return (
    <Typography component='span' sx={{ display: 'block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      <DiffChunks chunks={chunks} />
    </Typography>
  )
}
