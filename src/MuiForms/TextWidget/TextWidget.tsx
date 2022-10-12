import TextField, { StandardTextFieldProps as TextFieldProps } from '@mui/material/TextField'
import { utils, WidgetProps } from '@rjsf/core'
import React from 'react'
import { omit } from 'lodash'

const { getDisplayLabel } = utils

export type TextWidgetProps = WidgetProps & Pick<TextFieldProps, Exclude<keyof TextFieldProps, 'onBlur' | 'onFocus'>>

function TextWidget({
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
}: TextWidgetProps) {
  const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  const displayLabel = getDisplayLabel(schema, uiSchema)
  const inputType = (type || schema.type) === 'string' ? 'text' : `${type || schema.type}`

  return (
    <TextField
      id={id}
      placeholder={placeholder}
      label={displayLabel ? label || schema.title : false}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      type={inputType as string}
      value={value || value === 0 ? value : ''}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      {...(omit(textFieldProps, ['formContext', 'registry']) as TextFieldProps)}
    />
  )
}

export default TextWidget
