import { Button, Stack, Typography, TypographyProps } from '@mui/material'
import { useState } from 'react'

interface ExpandableTypographyProps extends Omit<TypographyProps, 'children'> {
  children: string
  maxLength?: number
  showMoreDirection?: 'column' | 'row' | 'row-reverse' | 'column-reverse'
}

export default function ExpandableTypography({
  children: text,
  maxLength = 100,
  showMoreDirection = 'row',
  ...props
}: ExpandableTypographyProps) {
  const [expanded, setExpanded] = useState(false)
  const isTruncated = text.length > maxLength

  if (isTruncated) {
    return (
      <Stack sx={{ mb: 1 }} direction={expanded ? 'column' : showMoreDirection} spacing={1}>
        <Typography {...props}>{expanded ? text : `${text.slice(0, maxLength).trimEnd()}...`}</Typography>
        <Button size='small' onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </Stack>
    )
  } else {
    return <Typography {...props}>{text}</Typography>
  }
}
