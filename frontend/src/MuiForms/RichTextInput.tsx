import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Markdown from 'src/common/MarkdownRenderer'
import RichTextEditor from 'src/common/RichTextEditor'

interface RichTextInputProps {
  label: string
  value: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  onChange: (newValue: string) => void
  InputProps?: any // TODO me - Should this be passed to textareaProps? (Probably not cause that's a MUI thing)
}

export default function RichTextInput({
  label,
  value,
  required,
  disabled,
  formContext,
  onChange,
  InputProps,
}: RichTextInputProps) {
  const theme = useTheme()

  if (!formContext.editMode) {
    const view = value ? (
      <Markdown>{value}</Markdown>
    ) : (
      <Typography
        sx={{
          fontStyle: 'italic',
          color: theme.palette.customTextInput.main,
        }}
      >
        Unanswered
      </Typography>
    )

    return (
      <>
        <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
        {view}
      </>
    )
  }

  return (
    <RichTextEditor
      value={value || (!formContext.editMode ? 'Unanswered' : '')}
      onChange={onChange}
      textareaProps={{ disabled: disabled || !formContext.editMode }}
      label={
        <Typography sx={{ fontWeight: 'bold' }}>
          {label}
          {required && formContext.editMode && <span style={{ color: 'red' }}>{' *'}</span>}
        </Typography>
      }
      key={label}
    />
  )
}
