import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, SyntheticEvent, useMemo } from 'react'

interface DropdownProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  options: { enumOptions?: { label: string; value: string }[] }
  rawErrors?: string[]
}

export default function Dropdown({ label, formContext, value, onChange, options, required, rawErrors }: DropdownProps) {
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

  return (
    <Fragment key={label}>
      <Typography fontWeight='bold'>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      {formContext.editMode && (
        <Autocomplete
          size='small'
          options={dropdownOptions}
          sx={{
            input: {
              color: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
            },
            label: {
              WebkitTextFillColor:
                theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: disabledWebkitTextFillColor,
            },
          }}
          onChange={handleChange}
          value={value || ''}
          disabled={!formContext.editMode}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Select an option below'
              size='small'
              placeholder='Unanswered'
              error={rawErrors && rawErrors.length > 0}
            />
          )}
        />
      )}
      {!formContext.editMode && (
        <Typography
          sx={{
            fontStyle: value ? 'unset' : 'italic',
            color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
          }}
        >
          {value ? value : 'Unanswered'}
        </Typography>
      )}
    </Fragment>
  )
}
