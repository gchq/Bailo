import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, useMemo } from 'react'

interface DropDownProps {
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

export default function DropDown(props: DropDownProps) {
  const { onChange, value, label, formContext, options } = props

  const theme = useTheme()

  const handleChange = (_event: React.SyntheticEvent<Element, Event>, newValue: any) => {
    newValue ? onChange(newValue) : onChange('')
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  const dropDownOptions = useMemo(() => {
    return options.enumOptions ? options.enumOptions.map((option) => option.value) : []
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
          }}
          onChange={handleChange}
          value={value}
          disabled={!formContext.editMode}
          renderInput={(params) => (
            <TextField {...params} label='Select an option below' size='small' placeholder='Unanswered' />
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
