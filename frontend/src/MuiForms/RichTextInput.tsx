import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FormContextType } from '@rjsf/utils'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'

interface RichTextInputProps {
  value: string
  onChange: (newValue: string) => void
  label?: string
  formContext?: FormContextType
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

  if (!formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  if (!formContext.editMode) {
    return (
      <>
        <Typography fontWeight='bold' aria-label={`label for ${label}`}>
          {label}
        </Typography>
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
    <>
      <RichTextEditor
        value={value}
        onChange={onChange}
        textareaProps={{ disabled, id }}
        errors={rawErrors}
        label={
          <Typography fontWeight='bold' aria-label={`label for ${label}`}>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
        }
        key={label}
      />
    </>
  )
}
