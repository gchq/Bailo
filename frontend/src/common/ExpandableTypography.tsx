import { Button, Stack, Typography, TypographyProps } from '@mui/material'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface ExpandableTypographyProps extends Omit<TypographyProps, 'children'> {
  children: string
  maxLines?: number
}

export default function ExpandableTypography({
  children: text,
  maxLines = 3,
  sx,
  ...props
}: ExpandableTypographyProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const typographyRef = useRef<HTMLElement>(null)

  const measureOverflow = useCallback(() => {
    if (!expanded && typographyRef.current) {
      setOverflows(typographyRef.current.scrollHeight > typographyRef.current.clientHeight)
    }
  }, [expanded])

  useLayoutEffect(() => {
    const typography = typographyRef.current
    if (!typography) {
      return
    }

    measureOverflow()
    const resizeObserver = new ResizeObserver(measureOverflow)
    resizeObserver.observe(typography)
    window.addEventListener('resize', measureOverflow)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureOverflow)
    }
  }, [maxLines, measureOverflow, text])

  const typography = (
    <Typography
      {...props}
      ref={typographyRef}
      sx={[
        ...(Array.isArray(sx) ? sx : [sx]),
        !expanded && {
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: maxLines,
        },
      ]}
    >
      {text}
    </Typography>
  )

  if (!overflows) {
    return typography
  }

  return (
    <Stack sx={{ mb: 1, alignItems: 'center' }} direction={expanded ? 'column' : 'row'} spacing={1}>
      {typography}
      <Button size='small' onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Show less' : 'Show more'}
      </Button>
    </Stack>
  )
}
