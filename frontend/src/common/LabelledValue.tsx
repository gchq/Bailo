import { Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'

interface LabelledValueProps {
  label: string
  value?: string
  richText?: boolean
  emptyText?: string
  action?: ReactNode
  /** Renders in place of the value. Only intended for editing a value in place, e.g. EditableText. */
  children?: ReactNode
}

/** Displays a value beneath a bold label, with an optional action (e.g. an edit button) beside the label. */
export default function LabelledValue({
  label,
  value,
  richText = false,
  emptyText = 'Empty',
  action,
  children,
}: LabelledValueProps) {
  const theme = useTheme()

  return (
    <Stack sx={{ width: '100%' }}>
      <Stack
        direction='row'
        spacing={1}
        sx={{
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          }}
        >
          {label}
        </Typography>
        {action}
      </Stack>
      {children ?? displayValue(value, richText, emptyText)}
    </Stack>
  )
}

function displayValue(value: string | undefined, richText: boolean, emptyText: string) {
  if (!value) {
    return <Typography sx={{ fontStyle: 'italic' }}>{emptyText}</Typography>
  }

  return richText ? <MarkdownDisplay>{value}</MarkdownDisplay> : <Typography>{value}</Typography>
}
