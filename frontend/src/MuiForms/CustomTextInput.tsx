import { Typography } from '@mui/material'
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
    <>
      <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
      <TextField
        size='small'
        sx={{
          input: {
            color: theme.palette.mode === 'light' ? 'black' : 'white',
          },
          label: {
            WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
          },
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: currentValue
              ? theme.palette.mode === 'light'
                ? 'black'
                : 'white'
              : theme.palette.mode === 'light'
              ? '#535353'
              : '#c8c8c8',
          },
          fontStyle: currentValue ? 'unset' : 'italic',
        }}
        onChange={_onChange}
        variant={!formContext.editMode ? 'standard' : 'outlined'}
        required={!formContext.editMode ? false : true}
        value={currentValue || (!formContext.editMode ? 'Unanswered' : '')}
        disabled={!formContext.editMode}
        InputProps={{
          ...props.InputProps,
          disableUnderline: !formContext.editMode ? true : false,
        }}
      />
    </>
  )
}
