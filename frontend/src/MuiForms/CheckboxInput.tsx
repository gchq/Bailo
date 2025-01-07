import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChangeEvent, Fragment } from 'react'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: boolean
  onChange: (newValue: boolean) => void
  InputProps?: any
  id: string
  rawErrors?: string[]
}

export default function CheckboxInput(props: CustomTextInputProps) {
  const { onChange, value, label, formContext, id, required } = props

  const theme = useTheme()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value === 'true')
  }

  if (!formContext.editMode && value == undefined) {
    return (
      <Typography
        sx={[
          value
            ? {
                fontStyle: 'unset',
              }
            : {
                fontStyle: 'italic',
              },
          value
            ? {
                color: theme.palette.common.black,
              }
            : {
                color: theme.palette.customTextInput.main,
              },
        ]}
      >
        Unanswered
      </Typography>
    )
  }

  return (
    <Fragment key={label}>
      <Typography id={`${id}-label`} fontWeight='bold'>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      {formContext.editMode && (
        <RadioGroup onChange={handleChange} value={value}>
          <FormControlLabel value={true} control={<Radio data-test={`${id}-yes-option`} />} label='Yes' />
          <FormControlLabel value={false} control={<Radio data-test={`${id}-no-option`} />} label='No' />
        </RadioGroup>
      )}
      {!formContext.editMode && <Typography>{value ? 'Yes' : 'No'}</Typography>}
    </Fragment>
  )
}
