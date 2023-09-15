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
}

export default function CustomTextInput(props: CustomTextInputProps) {
  const { onChange, value, label, formContext } = props

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
      <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
      <TextField
        size='small'
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
          disableUnderline: !formContext.editMod,
        }}
      />
    </Fragment>
  )
}
