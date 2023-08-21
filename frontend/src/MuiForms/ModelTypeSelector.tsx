/* eslint-disable @typescript-eslint/no-unused-vars */
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

export default function ModelTypeSelector(props: any) {
  const { onChange, value: currentValue, required, label, formContext } = props

  const _onChange = (_event: any, newValue: any) => {
    onChange(newValue?.value)
  }

  return (
    <Autocomplete
      // we might get a string or an object back
      isOptionEqualToValue={(option: any, value: any) => option.id === value.id || option.id === value}
      value={currentValue || null}
      onChange={_onChange}
      options={props.options.enumOptions}
      disabled={!formContext.editMode}
      popupIcon={!formContext.editMode ? <div></div> : <ExpandMoreIcon />}
      renderInput={(params) => (
        <TextField
          {...params}
          size='small'
          sx={
            !formContext.editMode
              ? { label: { WebkitTextFillColor: 'black' } }
              : { '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'black' } }
          }
          variant={!formContext.editMode ? 'standard' : 'outlined'}
          label={label}
          required={!formContext.editMode ? false : true}
          InputProps={{
            ...params.InputProps,
            disableUnderline: !formContext.editMode ? true : false,
          }}
        />
      )}
    />
  )
}
