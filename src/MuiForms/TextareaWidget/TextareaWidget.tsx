import React from 'react'

import { WidgetProps } from '@rjsf/core'

import TextField from '@mui/material/TextField'

type CustomWidgetProps = WidgetProps & {
  options: any
}

const TextareaWidget = ({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  rawErrors = [],
}: CustomWidgetProps) => {
  const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : value)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  return (
    <TextField
      id={id}
      label={label || schema.title}
      placeholder={placeholder}
      disabled={disabled || readonly}
      value={value}
      required={required}
      autoFocus={autofocus}
      multiline={true}
      rows={options.rows || 5}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  )
}

export default TextareaWidget
