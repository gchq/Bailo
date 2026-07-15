import { Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FieldPathId, Registry, RJSFSchema } from '@rjsf/utils'
import InlineDiff from 'src/common/InlineDiff'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

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

  const mirroredState = getMirroredState(id, registry.formContext) as string | undefined
  const compareFromState = getCompareFromState(id, registry.formContext) as string | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string | undefined
  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  if (inCompareMode && !registry.formContext.mirroredModel) {
    const from = compareFromState !== undefined ? compareFromState : mirroredState
    return (
      <Stack spacing={1}>
        <Typography
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
          sx={{ fontWeight: 'bold' }}
        >
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        <InlineDiff markdown from={from} to={value} />
      </Stack>
    )
  }

  const mirroredContent =
    inCompareMode && registry.formContext.mirroredModel && value ? (
      <InlineDiff markdown from={compareFromMirroredState} to={mirroredState} />
    ) : mirroredState ? (
      <MarkdownDisplay>{mirroredState}</MarkdownDisplay>
    ) : (
      <Typography component='span' sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
        Unanswered
      </Typography>
    )
  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredContent}
      display={inCompareMode && registry.formContext.mirroredModel ? true : registry.formContext.mirroredModel && value}
      required={required}
      label={label}
      id={id}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      {registry.formContext.editMode ? (
        <RichTextEditor
          value={value}
          onChange={onChange}
          textareaProps={{ disabled, id }}
          errors={rawErrors}
          key={label}
        />
      ) : inCompareMode && registry.formContext.mirroredModel && value ? (
        <InlineDiff markdown from={compareFromState} to={value} />
      ) : (
        value && <MarkdownDisplay>{value}</MarkdownDisplay>
      )}
    </AdditionalInformation>
  )
}
