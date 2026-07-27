import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FieldPathId, Registry, RJSFSchema } from '@rjsf/utils'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'

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
  schema: RJSFSchema
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
  schema,
}: RichTextInputProps) {
  const theme = useTheme()

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const compare = getCompareFieldState<string>(id, registry.formContext)

  const fallbackMirrored = compare.mirroredState ? (
    <MarkdownDisplay>{compare.mirroredState}</MarkdownDisplay>
  ) : (
    <Typography component='span' sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
      Unanswered
    </Typography>
  )

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={value}
      markdown
      fallbackMirroredContent={fallbackMirrored}
    >
      {compare.editMode ? (
        <RichTextEditor
          value={value}
          onChange={onChange}
          textareaProps={{ disabled, id }}
          errors={rawErrors}
          key={label}
        />
      ) : compare.inMirroredCompare && value ? (
        <InlineDiff markdown from={compare.compareFromState} to={value} />
      ) : value ? (
        <MarkdownDisplay>{value}</MarkdownDisplay>
      ) : (
        <Typography component='span' sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
          Unanswered
        </Typography>
      )}
    </CompareField>
  )
}
