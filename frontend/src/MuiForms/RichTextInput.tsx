import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FieldPathId, Registry } from '@rjsf/utils'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getMirroredState, getState } from 'utils/formUtils'

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

  const mirroredState = getMirroredState(id, registry.formContext)
  const state = getState(id, registry.formContext)

  if (!registry.formContext.editMode) {
    return (
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredState}
        state={state}
        display={registry.formContext.mirroredModel && value}
        label={label}
        required={required}
        id={id}
        mirroredModel={registry.formContext.mirroredModel}
      >
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
      </AdditionalInformation>
    )
  }

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredState}
      state={state}
      display={registry.formContext.mirroredModel && value}
      label={label}
      id={id}
      mirroredModel={registry.formContext.mirroredModel}
      description={registry.rootSchema.description}
    >
      <RichTextEditor
        value={registry.formContext.mirroredModel ? state : value}
        onChange={onChange}
        textareaProps={{ disabled, id }}
        errors={rawErrors}
        key={label}
      />
    </AdditionalInformation>
  )
}
