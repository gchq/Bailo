import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, SyntheticEvent, useEffect, useMemo, useRef } from 'react'

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
  id?: string
}

export default function Dropdown({
  label,
  formContext,
  value,
  onChange,
  options,
  required,
  rawErrors,
  id,
}: DropdownProps) {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValue: string | null) => {
    onChange(newValue || '')
  }

  useEffect(() => {
    document.body.addEventListener('click', (event) => {
      if (ref.current) {
        const questionComponent = event.composedPath().includes(ref.current)
        if (ref.current && questionComponent) {
          formContext.onClickListener(id)
        }
      }
    })
  }, [formContext])

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
    <div ref={ref} key={label}>
      <Typography fontWeight='bold'>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      {formContext.editMode && (
        <Autocomplete
          size='small'
          options={dropdownOptions}
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
    </div>
  )
}
