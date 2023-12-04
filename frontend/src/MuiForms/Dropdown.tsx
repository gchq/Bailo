import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, useMemo } from 'react'

interface SelectWidgetOptions {
  enumOptions: string[]
}

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  options: SelectWidgetOptions
}

export default function CustomTextInput(props: CustomTextInputProps) {
  const { onChange, value, label, formContext, options } = props

  const theme = useTheme()

  const handleChange = (_event: React.SyntheticEvent<Element, Event>, newValue: any) => {
    onChange(newValue.value)
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  const dropDownOptions = useMemo(() => {
    return options.enumOptions
  }, [options])

  return (
    <Fragment key={label}>
      <Typography fontWeight='bold'>{label}</Typography>
      {formContext.editMode && (
        <Autocomplete
          size='small'
          options={dropDownOptions || []}
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
          value={value || (!formContext.editMode ? 'Unanswered' : '')}
          disabled={!formContext.editMode}
          renderInput={(params) => <TextField {...params} label='Select an option below' size='small' />}
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
