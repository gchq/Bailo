import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, SyntheticEvent, useMemo } from 'react'

interface MultipleDropdownProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string[]
  onChange: (newValue: string[]) => void
  InputProps?: any
  options: { enumOptions?: { label: string; value: string }[] }
  rawErrors?: string[]
}

export default function MultipleDropdown({
  label,
  formContext,
  value,
  onChange,
  options,
  required,
  rawErrors,
}: MultipleDropdownProps) {
  const theme = useTheme()

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValue: string[]) => {
    onChange(newValue)
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value.length) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  const multipleDropdownOptions = useMemo(() => {
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
          multiple
          size='small'
          options={multipleDropdownOptions}
          sx={(theme) => ({
            input: {
              color: theme.palette.common.white,
              ...theme.applyStyles('light', {
                color: theme.palette.common.black,
              }),
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
          value={value || []}
          disabled={!formContext.editMode}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Select an option below'
              size='small'
              placeholder={value.length ? undefined : 'Unanswered'}
              error={rawErrors && rawErrors.length > 0}
            />
          )}
        />
      )}
      {!formContext.editMode && (
        <>
          {value.length ? (
            value.map((selectedValue) => (
              <Typography
                key={selectedValue}
                sx={{
                  fontStyle: 'unset',
                  color: theme.palette.common.black,
                }}
              >
                {selectedValue}
              </Typography>
            ))
          ) : (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
        </>
      )}
    </Fragment>
  )
}
