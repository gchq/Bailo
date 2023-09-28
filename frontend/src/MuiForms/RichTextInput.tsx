import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'

interface RichTextInputProps {
  label: string
  value: string
  formContext: any
  onChange: (newValue: string) => void
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export default function RichTextInput({ label, value, formContext, onChange, required, disabled }: RichTextInputProps) {
  const theme = useTheme()

  if (!formContext.editMode) {
    return (
      <>
        <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
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
      textareaProps={{ disabled: disabled }}
      label={
        <Typography sx={{ fontWeight: 'bold' }}>
          {label}
          {required && <span style={{ color: 'red' }}>{' *'}</span>}
        </Typography>
      }
      key={label}
    />
  )
}
