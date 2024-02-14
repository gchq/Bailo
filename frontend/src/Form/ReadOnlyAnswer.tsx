import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

type ReadOnlyAnswerProps = {
  value?: string
}

export default function ReadOnlyAnswer({ value }: ReadOnlyAnswerProps) {
  const theme = useTheme()

  return value ? (
    <Typography>{value}</Typography>
  ) : (
    <Typography
      sx={{
        color: theme.palette.customTextInput.main,
        fontStyle: 'italic',
      }}
    >
      Unanswered
    </Typography>
  )
}
