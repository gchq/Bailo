import { Box, Button, Typography, TypographyProps } from '@mui/material'
import { useState } from 'react'

interface ExpandableTypographyProps extends Omit<TypographyProps, 'children'> {
  children: string
  maxLength?: number
}

export default function ExpandableTypography({ children: text, maxLength = 100, ...props }: ExpandableTypographyProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    text.length > maxLength && (
      <Box sx={{ mb: 1 }}>
        <Typography {...props}>{expanded ? text : `${text.slice(0, maxLength)}...`}</Typography>
        <Button size='small' onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      </Box>
    )
  )
}
