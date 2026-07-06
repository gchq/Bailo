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

  const mirroredState = getMirroredState(id, registry.formContext)
  const compareFromState = getCompareFromState(id, registry.formContext) as string | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string | undefined
  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  if (inCompareMode && !registry.formContext.mirroredModel) {
    const from = compareFromState !== undefined ? compareFromState : (mirroredState as string | undefined)
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

  if (!registry.formContext.editMode) {
    const mirroredContent =
      inCompareMode && registry.formContext.mirroredModel ? (
        <InlineDiff markdown from={compareFromMirroredState} to={mirroredState as string | undefined} />
      ) : mirroredState ? (
        <MarkdownDisplay>{mirroredState}</MarkdownDisplay>
      ) : undefined
    const displayPanel =
      inCompareMode && registry.formContext.mirroredModel
        ? true
        : (registry.formContext.mirroredModel && value) || false
    return (
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredContent}
        display={displayPanel}
        label={label}
        required={required}
        id={id}
        mirroredModel={registry.formContext.mirroredModel}
        description={schema.description}
      >
        {inCompareMode && registry.formContext.mirroredModel ? (
          <InlineDiff markdown from={compareFromState} to={value} />
        ) : value ? (
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
      </AdditionalInformation>
    )
  }

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredState}
      display={registry.formContext.mirroredModel && value}
      required={required}
      label={label}
      id={id}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      <RichTextEditor
        value={value}
        onChange={onChange}
        textareaProps={{ disabled, id }}
        errors={rawErrors}
        key={label}
      />
    </AdditionalInformation>
  )
}
