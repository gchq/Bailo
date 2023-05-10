import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import * as React from 'react'

import { useListUsers } from '../../data/user'

export default function UserSelector(props: any) {
  const { users, isUsersLoading } = useListUsers()
  const [open, setOpen] = React.useState(false)

  const { onChange, value: currentValue, required, label } = props

  const _onChange = (_event: any, newValue: any) => {
    onChange(newValue?.id)
  }

  return (
    <Autocomplete
      open={open}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={() => {
        setOpen(false)
      }}
      // we might get a string or an object back
      isOptionEqualToValue={(option: any, value: any) => option.id === value.id || option.id === value}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.id)}
      value={currentValue || null}
      onChange={_onChange}
      options={users || []}
      loading={isUsersLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label + (required ? ' *' : '')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isUsersLoading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
