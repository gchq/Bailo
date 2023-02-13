import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { FieldTemplateProps } from '@rjsf/core'
import React from 'react'
import WrapIfAdditional from './WrapIfAdditional'

function FieldTemplate({
  id,
  children,
  disabled,
  displayLabel,
  hidden,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  rawErrors = [],
  rawHelp,
  rawDescription,
  schema,
}: FieldTemplateProps) {
  if (hidden) {
    return children
  }

  return (
    <WrapIfAdditional
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
    >
      <FormControl fullWidth error={!!rawErrors.length} required={required}>
        {children}
        {displayLabel && rawDescription ? (
          <Typography variant='caption' color='textSecondary'>
            {rawDescription}
          </Typography>
        ) : null}
        {rawErrors.length > 0 && (
          <List dense disablePadding>
            {rawErrors.map((error) => (
              <ListItem key={`${id}-${error}`} disableGutters>
                <FormHelperText id={id}>{error}</FormHelperText>
              </ListItem>
            ))}
          </List>
        )}
        {rawHelp && <FormHelperText id={id}>{rawHelp}</FormHelperText>}
      </FormControl>
    </WrapIfAdditional>
  )
}

export default FieldTemplate
