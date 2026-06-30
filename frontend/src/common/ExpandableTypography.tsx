import { Button, Stack, Typography, TypographyProps } from '@mui/material'
import { useState } from 'react'

interface ExpandableTypographyProps extends Omit<TypographyProps, 'children'> {
  children: string
  maxLength?: number
}

export default function ExpandableTypography({ children: text, maxLength = 100, ...props }: ExpandableTypographyProps) {
  const [expanded, setExpanded] = useState(false)

  if (text.length > maxLength) {
    return (
      <Stack sx={{ mb: 1, alignItems: 'center' }} direction={expanded ? 'column' : 'row'} spacing={1}>
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
