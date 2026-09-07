import { Button, Stack } from '@mui/material'
import { useMemo, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import { getMarkdownPreview } from 'utils/markdownUtils'

interface ExpandableMarkdownProps {
  children: string
  maxLength?: number
  showMoreDirection?: 'column' | 'row' | 'row-reverse' | 'column-reverse'
}

export default function ExpandableMarkdown({
  children: text,
  maxLength = 100,
  showMoreDirection = 'row',
}: ExpandableMarkdownProps) {
  const [expanded, setExpanded] = useState(false)

  const markdownPreview = useMemo(() => getMarkdownPreview(text, maxLength), [maxLength, text])
  const isTruncated = markdownPreview?.truncated

  if (isTruncated) {
    return (
      <Stack sx={{ mb: 1 }} direction={expanded ? 'column' : showMoreDirection} spacing={1}>
        <MarkdownDisplay>{expanded ? text : markdownPreview?.markdown || ''}</MarkdownDisplay>
        <Button size='small' onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </Stack>
    )
  } else {
    return <MarkdownDisplay>{text}</MarkdownDisplay>
  }
}
