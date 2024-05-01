import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'

interface RichTextInputProps {
  value: string
  onChange: (newValue: string) => void
  label?: string
  formContext?: any
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  id: string
  rawErrors?: string[]
}

export default function RichTextInput({
  label,
  value,
  formContext,
  onChange,
  required,
  disabled,
  id,
  rawErrors,
}: RichTextInputProps) {
  const theme = useTheme()

  if (!formContext.editMode) {
    return (
      <>
        <Typography fontWeight='bold'>{label}</Typography>
        {value ? (
          <MarkdownDisplay>{value}</MarkdownDisplay>
        ) : (
          <Typography
            sx={{
              fontStyle: 'italic',
              color: theme.palette.customTextInput.main,
            }}
          >
            Unanswered
          </Typography>
        )}
      </>
    )
  }

  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      textareaProps={{ disabled, id }}
      errors={rawErrors}
      label={
        <Typography fontWeight='bold'>
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
      }
      key={label}
    />
  )
}
