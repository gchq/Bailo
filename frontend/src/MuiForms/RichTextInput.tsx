import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FieldPathId, Registry } from '@rjsf/utils'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'

interface RichTextInputProps {
  value: string
  onChange: (newValue: string) => void
  label?: string
  registry?: Registry
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  id: string
  rawErrors?: string[]
  fieldPath?: FieldPathId
}

export default function RichTextInput({
  label,
  value,
  registry,
  onChange,
  required,
  disabled,
  id,
  rawErrors,
}: RichTextInputProps) {
  const theme = useTheme()

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  if (!registry.formContext.editMode && registry.formContext.mirroredModel) {
    const mirroredState = id
      .replaceAll('root_', '')
      .replaceAll('_', '.')
      .split('.')
      .filter((t) => t !== '')
      .reduce((prev, cur) => prev && prev[cur], registry.formContext.mirroredState)

    return (
      <>
        <Typography fontWeight='bold' aria-label={`label for ${label}`}>
          {label}
        </Typography>
        {mirroredState ? (
          <MarkdownDisplay>{mirroredState}</MarkdownDisplay>
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
        <AdditionalInformation>{value ? <Typography>{value}</Typography> : undefined}</AdditionalInformation>
      </>
    )
  }

  if (!registry.formContext.editMode) {
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
          <Typography fontWeight='bold' aria-label={`label for ${label}`} component='label' htmlFor={id}>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
        }
        key={label}
      />
    </>
  )
}
