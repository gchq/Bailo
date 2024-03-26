import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { forwardRef, Fragment, useMemo } from 'react'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  id: string
  rawErrors?: string[]
}

export default function CustomTextInput(props: CustomTextInputProps) {
  const { onChange, value, label, formContext, id, required, rawErrors } = props

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

  const TextInput = forwardRef((props: any, ref: any) => (
    <TextField
      size='small'
      id={id}
      error={rawErrors && rawErrors.length > 0}
      sx={{
        input: {
          color: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
        },
        label: {
          WebkitTextFillColor: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: disabledWebkitTextFillColor,
        },
        fontStyle: value ? 'unset' : 'italic',
      }}
      onChange={handleChange}
      variant={!formContext.editMode ? 'standard' : 'outlined'}
      required={formContext.editMode}
      value={value || (!formContext.editMode ? 'Unanswered' : '')}
      disabled={!formContext.editMode}
      ref={ref}
      InputProps={{
        ...props.inputProps,
        ...(!formContext.editMode && { disableUnderline: true }),
        'data-test': id,
        autoFocus: formContext.firstQuestionKey === id,
      }}
      onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
    />
  ))
  TextInput.displayName = 'TextInput'

  return (
    <Fragment key={label}>
      <Typography id={`${id}-label`} fontWeight='bold'>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      <TextInput />
    </Fragment>
  )
}
