import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { WidgetProps } from '@rjsf/core'
import React from 'react'

function RadioWidget({
  id,
  schema,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) {
  const { enumOptions, enumDisabled } = options

  const _onChange = (_: any, newValue: any) => onChange(schema.type === 'boolean' ? newValue !== 'false' : newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  const row = options ? options.inline : false

  return (
    <>
      <FormLabel required={required} htmlFor={id}>
        {label || schema.title}
      </FormLabel>
      <RadioGroup value={`${value}`} row={row as boolean} onChange={_onChange} onBlur={_onBlur} onFocus={_onFocus}>
        {(enumOptions as any).map((option: any) => {
          const itemDisabled = enumDisabled && (enumDisabled as any).indexOf(option.value) !== -1

          return (
            <FormControlLabel
              control={<Radio color='primary' key={option.value} />}
              label={`${option.label}`}
              value={`${option.value}`}
              key={option.value}
              disabled={disabled || itemDisabled || readonly}
            />
          )
        })}
      </RadioGroup>
    </>
  )
}

export default RadioWidget
