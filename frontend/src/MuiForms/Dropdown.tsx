import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry } from '@rjsf/utils'
import { Fragment, SyntheticEvent, useMemo } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getMirroredState } from 'utils/formUtils'

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

  const mirroredState = getMirroredState(id, registry.formContext)

  return (
    <Fragment key={label}>
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredState}
        display={registry.formContext.mirroredModel && value}
        label={label}
        id={id}
        required={required}
        mirroredModel={registry.formContext.mirroredModel}
      >
        <Typography fontWeight='bold' aria-label={`label for ${label}`} component='label' htmlFor={id}>
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        {registry.formContext.editMode && (
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
            disabled={!registry.formContext.editMode}
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
        )}
        {!registry.formContext.editMode && (
          <Typography
            sx={{
              fontStyle: value ? 'unset' : 'italic',
              color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
            }}
          >
            {value ? value : 'Unanswered'}
          </Typography>
        )}
      </AdditionalInformation>
    </Fragment>
  )
}
