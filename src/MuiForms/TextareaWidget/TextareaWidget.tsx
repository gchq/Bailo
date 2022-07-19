import React from 'react'

import TextField, { StandardTextFieldProps as TextFieldProps } from '@mui/material/TextField'

import { WidgetProps, utils } from '@rjsf/core'

const { getDisplayLabel } = utils

type CustomWidgetProps = WidgetProps & {
  options: any
}

const TextareaWidget = ({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  type,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  uiSchema,
  rawErrors = [],
  formContext,
  registry, // pull out the registry so it doesn't end up in the textFieldProps
  ...textFieldProps
}: CustomWidgetProps) => {
  const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  const displayLabel = getDisplayLabel(schema, uiSchema)
  const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`
  const height = Math.min(5, Math.max(1, Math.floor((schema.maxLength || 0) / 150)))

  return (
    <TextField
      id={id}
      placeholder={placeholder}
      label={displayLabel ? label || schema.title : false}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      type={inputType as string}
      multiline
      value={value || value === 0 ? value : ''}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      rows={height}
      {...(textFieldProps as TextFieldProps)}
    />
  )
}

export default TextareaWidget
