import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry } from '@rjsf/utils'
import { Fragment, SyntheticEvent, useMemo } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getMirroredState } from 'utils/formUtils'

interface MultipleDropdownProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: string[]
  onChange: (newValue: string[]) => void
  InputProps?: any
  options: { enumOptions?: { label: string; value: string }[] }
  rawErrors?: string[]
  id: string
}

export default function MultipleDropdown({
  label,
  registry,
  value,
  onChange,
  options,
  required,
  rawErrors,
  id,
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
      >
        <Typography fontWeight='bold' aria-label={`label for ${label}`} component='label' htmlFor={id}>
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        {registry.formContext.editMode && (
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
            disabled={!registry.formContext.editMode}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Select an option below'
                size='small'
                id={id}
                aria-label={`input field for ${label}`}
                placeholder={value.length ? undefined : 'Unanswered'}
                error={rawErrors && rawErrors.length > 0}
              />
            )}
          />
        )}
        {!registry.formContext.editMode && (
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
      </AdditionalInformation>
    </Fragment>
  )
}
