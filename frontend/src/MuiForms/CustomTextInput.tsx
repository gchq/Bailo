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

  return (
    <TextField
      {...props}
      size='small'
      sx={
        !formContext.editMode
          ? { label: { WebkitTextFillColor: 'black' } }
          : { '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'black' } }
      }
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
