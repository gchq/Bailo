import TextField, { StandardTextFieldProps as TextFieldProps } from '@mui/material/TextField'
import { utils, WidgetProps } from '@rjsf/core'
import React from 'react'
import { omit } from 'lodash'

const { getDisplayLabel } = utils

type CustomWidgetProps = WidgetProps & {
  options: any
}

function TextareaWidget({
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
  ...textFieldProps
}: CustomWidgetProps) {
  const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  const displayLabel = getDisplayLabel(schema, uiSchema)
  const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`
  const height = Math.min(5, Math.max(1, Math.floor((schema.maxLength || 0) / 150)))
  const isMultiline = height > 1

  return (
    <TextField
      id={id}
      placeholder={placeholder}
      label={displayLabel ? label || schema.title : false}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      type={inputType}
      multiline={isMultiline}
      value={value || value === 0 ? value : ''}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      maxRows={isMultiline ? height * 3 : 1}
      minRows={height}
      {...(omit(textFieldProps, ['formContext', 'registry']) as TextFieldProps)}
    />
  )
}

export default TextareaWidget
