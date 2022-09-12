import FormLabel from '@mui/material/FormLabel'
import Slider from '@mui/material/Slider'
import { utils, WidgetProps } from '@rjsf/core'
import React from 'react'

const { rangeSpec } = utils

function RangeWidget({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  onChange,
  required,
  label,
  id,
}: WidgetProps) {
  const sliderProps = { value, label, id, ...rangeSpec(schema) }

  const _onChange = (_: any, newValue: any) => onChange(newValue === '' ? options.emptyValue : newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  return (
    <>
      <FormLabel required={required} id={id}>
        {label}
      </FormLabel>
      <Slider
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        valueLabelDisplay='auto'
        {...sliderProps}
      />
    </>
  )
}

export default RangeWidget
