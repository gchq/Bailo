import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'
import { utils } from '@rjsf/core'
import { JSONSchema7 } from 'json-schema'
import React from 'react'
import IconButton from '../IconButton/IconButton'

const { ADDITIONAL_PROPERTY_FLAG } = utils

type WrapIfAdditionalProps = {
  children: React.ReactElement
  disabled: boolean
  id: string
  label: string
  onDropPropertyClick: (index: string) => (event?: any) => void
  onKeyChange: (index: string) => (event?: any) => void
  readonly: boolean
  required: boolean
  schema: JSONSchema7
}

function WrapIfAdditional({
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
}: WrapIfAdditionalProps) {
  const keyLabel = `${label} Key` // i18n ?
  const additional = Object.prototype.hasOwnProperty.call(schema, ADDITIONAL_PROPERTY_FLAG)
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  }

  if (!additional) {
    return children
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) => onKeyChange(target.value)

  return (
    <Grid container key={`${id}-key`} alignItems='center' spacing={2}>
      <Grid item xs>
        <FormControl fullWidth required={required}>
          <InputLabel>{keyLabel}</InputLabel>
          <Input
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type='text'
          />
        </FormControl>
      </Grid>
      <Grid item xs>
        {children}
      </Grid>
      <Grid item>
        <IconButton
          icon='remove'
          tabIndex={-1}
          style={btnStyle as any}
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
        />
      </Grid>
    </Grid>
  )
}

export default WrapIfAdditional
