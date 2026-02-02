import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry } from '@rjsf/utils'
import { ChangeEvent, Fragment } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getMirroredState } from 'utils/formUtils'

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
}

export default function CheckboxInput({ onChange, value, label, registry, id, required }: CustomTextInputProps) {
  const theme = useTheme()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value === 'true')
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext)

  if (!registry.formContext.editMode && value == undefined) {
    return (
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredState}
        display={registry.formContext.mirroredModel && value}
        label={label}
        id={id}
        required={required}
        mirroredModel={registry.formContext.mirroredModel}
      >
        <Typography
          sx={{
            fontStyle: value ? 'unset' : 'italic',
            color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
          }}
          aria-label={`Label for ${label}`}
        >
          Unanswered
        </Typography>
      </AdditionalInformation>
    )
  }

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredState}
      display={registry.formContext.mirroredModel && value !== undefined}
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
    >
      {registry.formContext.editMode && (
        <RadioGroup onChange={handleChange} value={value} aria-label={`radio input field for ${label}`} id={id}>
          <FormControlLabel value={true} control={<Radio data-test={`${id}-yes-option`} />} label='Yes' />
          <FormControlLabel value={false} control={<Radio data-test={`${id}-no-option`} />} label='No' />
        </RadioGroup>
      )}
      {!registry.formContext.editMode && (
        <>
          <Typography>{value ? 'Yes' : 'No'}</Typography>
        </>
      )}
    </AdditionalInformation>
  )
}
