import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { utils, WidgetProps } from '@rjsf/core'
import React from 'react'

const { asNumber, guessType } = utils

const nums = new Set(['number', 'integer'])

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema
  if (value === '') {
    return undefined
  }
  if (type === 'array' && items && nums.has(items.type)) {
    return value.map(asNumber)
  }
  if (type === 'boolean') {
    return value === 'true'
  }
  if (type === 'number') {
    return asNumber(value)
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x: any) => guessType(x) === 'number')) {
      return asNumber(value)
    }
    if (schema.enum.every((x: any) => guessType(x) === 'boolean')) {
      return value === 'true'
    }
  }

  return value
}

function SelectWidget({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
}: WidgetProps) {
  const { enumOptions, enumDisabled } = options

  const emptyValue = multiple ? [] : ''

  const _onChange = ({ target: { value: newValue } }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processValue(schema, newValue))
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, processValue(schema, newValue))
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, processValue(schema, newValue))

  return (
    <TextField
      id={id}
      label={label || schema.title}
      select
      value={typeof value === 'undefined' ? emptyValue : value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      InputLabelProps={{
        shrink: true,
      }}
      SelectProps={{
        multiple: typeof multiple === 'undefined' ? false : multiple,
      }}
    >
      {(enumOptions as any).map(({ value: optionValue, label: optionLabel }: any) => {
        const optionDisabled: any = enumDisabled && (enumDisabled as any).indexOf(optionValue) !== -1
        return (
          <MenuItem key={optionValue} value={optionValue} disabled={optionDisabled}>
            {optionLabel}
          </MenuItem>
        )
      })}
    </TextField>
  )
}

export default SelectWidget
