import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry } from '@rjsf/utils'
import { ChangeEvent, Fragment } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'

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
          <>
            <Typography>{mirroredState}</Typography>
          </>
        ) : (
          <Typography
            sx={{
              fontStyle: value ? 'unset' : 'italic',
              color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
            }}
            aria-label={`Label for ${label}`}
          >
            Unanswered
          </Typography>
        )}
        <AdditionalInformation>{value ? <Typography>{value}</Typography> : undefined}</AdditionalInformation>
      </>
    )
  }

  if (!registry.formContext.editMode && value == undefined) {
    return (
      <Typography
        sx={{
          fontStyle: value ? 'unset' : 'italic',
          color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
        }}
        aria-label={`Label for ${label}`}
      >
        Unanswered
      </Typography>
    )
  }

  return (
    <Fragment key={label}>
      <Typography id={`${id}-label`} fontWeight='bold' aria-label={`Label for ${label}`} component='label' htmlFor={id}>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
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
    </Fragment>
  )
}
