import { Button, Stack, Typography, TypographyProps } from '@mui/material'
import { useMemo, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import { getMarkdownPreview } from 'utils/markdownUtils'

interface ExpandableTypographyProps extends Omit<TypographyProps, 'children'> {
  children: string
  maxLength?: number
  showMarkdown?: boolean
  showMoreDirection?: 'column' | 'row' | 'row-reverse' | 'column-reverse'
}

export default function ExpandableTypography({
  children: text,
  maxLength = 100,
  showMarkdown = false,
  showMoreDirection = 'row',
  ...props
}: ExpandableTypographyProps) {
  const [expanded, setExpanded] = useState(false)

  const markdownPreview = useMemo(
    () => (showMarkdown ? getMarkdownPreview(text, maxLength) : null),
    [maxLength, showMarkdown, text],
  )
  const isTruncated = showMarkdown ? markdownPreview?.truncated : text.length > maxLength

  if (isTruncated) {
    return (
      <Stack sx={{ mb: 1, alignItems: 'center' }} direction={expanded ? 'column' : showMoreDirection} spacing={1}>
        {showMarkdown ? (
          <MarkdownDisplay>{expanded ? text : markdownPreview?.markdown || ''}</MarkdownDisplay>
        ) : (
          <Typography {...props}>{expanded ? text : `${text.slice(0, maxLength).trimEnd()}...`}</Typography>
        )}
        <Button size='small' onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </Stack>
    )
  } else {
    return showMarkdown ? <MarkdownDisplay>{text}</MarkdownDisplay> : <Typography {...props}>{text}</Typography>
  }
}
