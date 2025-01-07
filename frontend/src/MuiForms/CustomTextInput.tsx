import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Fragment, useMemo } from 'react'

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

  return (
    <Fragment key={label}>
      <Typography id={`${id}-label`} fontWeight='bold'>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      <TextField
        size='small'
        id={id}
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
            ...props.InputProps,
            ...(!formContext.editMode && { disableUnderline: true }),
            'data-test': id,
          },
        }}
      />
    </Fragment>
  )
}
