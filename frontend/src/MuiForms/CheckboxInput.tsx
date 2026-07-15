import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { ChangeEvent } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: boolean
  onChange: (newValue: boolean) => void
  InputProps?: any
  id: string
  rawErrors?: string[]
  schema: RJSFSchema
}

export default function CheckboxInput({
  onChange,
  value,
  label,
  registry,
  id,
  required,
  schema,
}: CustomTextInputProps) {
  const theme = useTheme()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value === 'true')
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext) as boolean | undefined

  const compareFromState = getCompareFromState(id, registry.formContext) as boolean | undefined

  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as boolean | undefined

  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  const formatBoolean = (val?: boolean) => {
    if (val === undefined) {
      return
    }

    return val ? 'Yes' : 'No'
  }

  if (inCompareMode && !registry.formContext.mirroredModel) {
    const from = compareFromState ?? mirroredState

    return (
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredState}
        display={false}
        label={label}
        id={id}
        required={required}
        mirroredModel={registry.formContext.mirroredModel}
        description={schema.description}
      >
        <InlineDiff from={formatBoolean(from)} to={formatBoolean(value)} />
      </AdditionalInformation>
    )
  }

  if (!registry.formContext.editMode && value === undefined) {
    return (
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredState}
        display={registry.formContext.mirroredModel && value !== undefined}
        label={label}
        id={id}
        required={required}
        mirroredModel={registry.formContext.mirroredModel}
        description={schema.description}
      >
        <Typography
          sx={{
            fontStyle: 'italic',
            color: theme.palette.customTextInput.main,
          }}
          aria-label={`Label for ${label}`}
        >
          Unanswered
        </Typography>
      </AdditionalInformation>
    )
  }

  const mirroredContent =
    inCompareMode && registry.formContext.mirroredModel && value ? (
      <InlineDiff from={formatBoolean(compareFromMirroredState)} to={formatBoolean(mirroredState)} />
    ) : mirroredState !== undefined ? (
      <Typography>{formatBoolean(mirroredState)}</Typography>
    ) : undefined

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredContent}
      display={inCompareMode && registry.formContext.mirroredModel ? true : registry.formContext.mirroredModel && value}
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      {registry.formContext.editMode ? (
        <RadioGroup onChange={handleChange} value={value} aria-label={`radio input field for ${label}`} id={id}>
          <FormControlLabel value={true} control={<Radio data-test={`${id}-yes-option`} />} label='Yes' />
          <FormControlLabel value={false} control={<Radio data-test={`${id}-no-option`} />} label='No' />
        </RadioGroup>
      ) : inCompareMode && registry.formContext.mirroredModel && value ? (
        <InlineDiff from={formatBoolean(compareFromState)} to={formatBoolean(value)} />
      ) : (
        value && <Typography>{formatBoolean(value)}</Typography>
      )}
    </AdditionalInformation>
  )
}
