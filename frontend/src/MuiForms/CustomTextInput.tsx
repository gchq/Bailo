import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { FormContextType } from '@rjsf/utils'
import { Fragment, useMemo } from 'react'
import MessageAlert from 'src/MessageAlert'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: FormContextType
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  id: string
  rawErrors?: string[]
}

export default function CustomTextInput({
  onChange,
  value,
  label,
  formContext,
  id,
  required,
  rawErrors,
  InputProps,
}: CustomTextInputProps) {
  const theme = useTheme()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  if (!formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  return (
    <Fragment key={label}>
      <Typography id={`${id}-label`} fontWeight='bold' aria-label={`Label for ${label}`} component='label' htmlFor={id}>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      <TextField
        size='small'
        error={rawErrors && rawErrors.length > 0}
        sx={[
          (theme) => ({
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
          }),
          value
            ? {
                fontStyle: 'unset',
              }
            : {
                fontStyle: 'italic',
              },
        ]}
        onChange={handleChange}
        variant={!formContext.editMode ? 'standard' : 'outlined'}
        required={formContext.editMode}
        value={value || (!formContext.editMode ? 'Unanswered' : '')}
        disabled={!formContext.editMode}
        slotProps={{
          input: {
            ...InputProps,
            ...(!formContext.editMode && { disableUnderline: true }),
            'data-test': id,
            'aria-label': `text input field for ${label}`,
            id: id,
          },
        }}
      />
    </Fragment>
  )
}
