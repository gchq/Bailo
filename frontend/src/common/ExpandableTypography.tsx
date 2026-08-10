import { Button, Stack, Typography, TypographyProps } from '@mui/material'
import { useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'

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
  const textWithoutImages = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '[image]')

  if (textWithoutImages.length > maxLength) {
    return (
      <Stack sx={{ mb: 1, alignItems: 'center' }} direction={expanded ? 'column' : showMoreDirection} spacing={1}>
        {showMarkdown ? (
          <MarkdownDisplay>{expanded ? text : `${textWithoutImages.slice(0, maxLength).trimEnd()}...`}</MarkdownDisplay>
        ) : (
          <Typography {...props}>{expanded ? text : `${text.slice(0, maxLength).trimEnd()}...`}</Typography>
        )}
        <Button size='small' onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </Stack>
    )
  } else {
    return <Typography {...props}>{textWithoutImages}</Typography>
  }
}
