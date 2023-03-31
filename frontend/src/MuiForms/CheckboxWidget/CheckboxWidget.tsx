import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { utils, WidgetProps } from '@rjsf/core'
import React from 'react'

// Due to not being able to change the default behaviour of "booleans" in the schema
// to use radio components, we have edited this custom CheckboxWidget component
// to behave like a radio component instead.

const { schemaRequiresTrueValue } = utils

function CheckboxWidget(props: WidgetProps) {
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

  const _onChange = (_: any, newValue: any) => onChange(schema.type === 'boolean' ? newValue !== 'false' : newValue)
  const _onBlur = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)
  const _onFocus = ({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)

  return (
    <>
      <FormLabel required={required} htmlFor={id}>
        {label || schema.title}
      </FormLabel>
      <RadioGroup value={`${value}`} onChange={_onChange} onBlur={_onBlur} onFocus={_onFocus}>
        {(enumOptions as any).map((option: any) => (
          <FormControlLabel
            control={<Radio color='primary' key={option.value} />}
            label={`${option.label}`}
            value={`${option.value}`}
            key={option.value}
            disabled={disabled || readonly}
          />
        ))}
      </RadioGroup>
    </>
  )
}

export default CheckboxWidget
