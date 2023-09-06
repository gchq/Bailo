import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'

interface EntitySelectorProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
}

export default function EntitySelector(props: EntitySelectorProps) {
  const { onChange, value: currentValue, label, formContext } = props

  const _onChange = (e) => {
    onChange(e.target.value)
  }

  const theme = useTheme()

  return (
    <TextField
      {...props}
      size='small'
      sx={{
        input: {
          color: theme.palette.mode === 'light' ? 'black' : 'white',
        },
        label: {
          WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
        },
      }}
      onChange={_onChange}
      variant={!formContext.editMode ? 'standard' : 'outlined'}
      label={label}
      required={!formContext.editMode ? false : true}
      value={currentValue || ''}
      disabled={!formContext.editMode}
      InputProps={{
        ...props.InputProps,
        disableUnderline: !formContext.editMode ? true : false,
      }}
    />
  )
}
