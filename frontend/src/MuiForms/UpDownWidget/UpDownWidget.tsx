import FormControl from '@mui/material/FormControl'
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'
import { WidgetProps } from '@rjsf/core'
import React from 'react'

function UpDownWidget({
  id,
  required,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
}: WidgetProps) {
  const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => onChange(newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  return (
    <FormControl fullWidth required={required}>
      <InputLabel>{label}</InputLabel>
      <Input
        id={id}
        autoFocus={autofocus}
        required={required}
        type='number'
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </FormControl>
  )
}

export default UpDownWidget
