import { Autocomplete, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, SyntheticEvent, useMemo } from 'react'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  options: any
}

export default function CustomTextInput(props: CustomTextInputProps) {
  const { onChange, value, label, formContext, options } = props

  const theme = useTheme()

  const handleChange = (_event: SyntheticEvent<Element, Event>, value: string | null) => {
    if (value) {
      onChange(value)
    }
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
      <Typography fontWeight='bold'>{label}</Typography>
      <Autocomplete
        size='small'
        options={options.enumOptions || []}
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
          fontStyle: value ? 'unset' : 'italic',
        }}
        onChange={handleChange}
        variant={!formContext.editMode ? 'standard' : 'outlined'}
        required={formContext.editMode}
        value={value || (!formContext.editMode ? 'Unanswered' : '')}
        disabled={!formContext.editMode}
        InputProps={{
          ...props.InputProps,
          ...(!formContext.editMode && { disableUnderline: true }),
        }}
      />
    </Fragment>
  )
}
