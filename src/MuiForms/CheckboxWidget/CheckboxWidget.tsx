import React from 'react'

import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'

import { WidgetProps, utils } from '@rjsf/core'

// Due to not being able to change the default behaviour of "booleans" in the schema
// to use radio components, we have edited this custom CheckboxWidget component
// to behave like a radio component instead.

const { schemaRequiresTrueValue } = utils

const CheckboxWidget = (props: WidgetProps) => {
  const { schema, id, value, disabled, readonly, label, onChange, onBlur, onFocus } = props

  const required = schemaRequiresTrueValue(schema)

  const enumOptions = [
    {
      label: 'Yes',
      value: true,
    },
    {
      label: 'No',
      value: false,
    },
  ]

  const _onChange = ({}, value: any) => onChange(schema.type == 'boolean' ? value !== 'false' : value)
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value)
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value)

  return (
    <>
      <FormLabel required={required} htmlFor={id}>
        {label || schema.title}
      </FormLabel>
      <RadioGroup value={`${value}`} row={false} onChange={_onChange} onBlur={_onBlur} onFocus={_onFocus}>
        {(enumOptions as any).map((option: any, i: number) => {
          return (
            <FormControlLabel
              control={<Radio color='primary' key={i} />}
              label={`${option.label}`}
              value={`${option.value}`}
              key={i}
              disabled={disabled || readonly}
            />
          )
        })}
      </RadioGroup>
    </>
  )
}

export default CheckboxWidget
