import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { SyntheticEvent, useMemo } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'

interface DropdownProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  options: { enumOptions?: { label: string; value: string }[] }
  rawErrors?: string[]
  id: string
  schema: RJSFSchema
}

export default function Dropdown({
  label,
  registry,
  value,
  onChange,
  options,
  required,
  rawErrors,
  id,
  schema,
}: DropdownProps) {
  const theme = useTheme()

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValue: string | null) => {
    onChange(newValue || '')
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  const dropdownOptions = useMemo(() => {
    return options.enumOptions ? options.enumOptions.map((option) => option.value) : []
  }, [options])

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const compare = getCompareFieldState<string>(id, registry.formContext)

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={value}
    >
      {compare.editMode ? (
        <Autocomplete
          size='small'
          options={dropdownOptions}
          sx={(theme) => ({
            input: {
              color: theme.palette.common.white,
              ...theme.applyStyles('light', {
                color: theme.palette.common.black,
              }),
              id: id,
            },
            label: {
              WebkitTextFillColor: theme.palette.common.white,
              ...theme.applyStyles('light', {
                WebkitTextFillColor: theme.palette.common.black,
              }),
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: disabledWebkitTextFillColor,
            },
          })}
          onChange={handleChange}
          value={value || ''}
          disabled={!compare.editMode}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Select an option below'
              size='small'
              placeholder='Unanswered'
              aria-label={`input field for ${label}`}
              error={rawErrors && rawErrors.length > 0}
            />
          )}
        />
      ) : compare.inMirroredCompare && value ? (
        <InlineDiff from={compare.compareFromState} to={value} />
      ) : (
        value && <Typography>{value}</Typography>
      )}
    </CompareField>
  )
}
