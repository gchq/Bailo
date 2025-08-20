import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChangeEvent, useEffect, useRef } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value === 'true')
  }

  useEffect(() => {
    document.body.addEventListener('click', (event) => {
      if (ref.current) {
        const questionComponent = event.composedPath().includes(ref.current)
        if (ref.current && questionComponent) {
          formContext.onClickListener(id)
        }
      }
    })
  }, [formContext])

  if (!formContext.editMode && value == undefined) {
    return (
      <Typography
        sx={{
          fontStyle: value ? 'unset' : 'italic',
          color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
        }}
      >
        Unanswered
      </Typography>
    )
  }

  return (
    <div key={label} ref={ref}>
      <Typography id={`${id}-label`} fontWeight='bold'>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      {!formContext.hideInputs && (
        <div>
          {formContext.editMode && (
            <RadioGroup onChange={handleChange} value={value}>
              <FormControlLabel value={true} control={<Radio data-test={`${id}-yes-option`} />} label='Yes' />
              <FormControlLabel value={false} control={<Radio data-test={`${id}-no-option`} />} label='No' />
            </RadioGroup>
          )}
          {!formContext.editMode && <Typography>{value ? 'Yes' : 'No'}</Typography>}
        </div>
      )}
    </div>
  )
}
