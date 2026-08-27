import { Typography } from '@mui/material'
import MarkdownDisplay from 'src/common/MarkdownDisplay'

interface ValueDisplayProps {
  value?: string
  richText?: boolean
  emptyText?: string
}

/** Renders a value as plain text or markdown, falling back to an italic placeholder when unset. */
export default function ValueDisplay({ value, richText = false, emptyText = 'Empty' }: ValueDisplayProps) {
  if (!value) {
    return <Typography sx={{ fontStyle: 'italic' }}>{emptyText}</Typography>
  }

  return richText ? <MarkdownDisplay>{value}</MarkdownDisplay> : <Typography>{value}</Typography>
}
