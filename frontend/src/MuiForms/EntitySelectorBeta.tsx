import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import * as React from 'react'

import { useListUsers } from '../../data/user'

interface EntitySelectorProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
}

export default function EntitySelector(props: EntitySelectorProps) {
  const { users, isUsersLoading: isLoading } = useListUsers()
  const [open, setOpen] = React.useState(false)

  const entities = React.useMemo(() => {
    let tempEntities: string[] = []

    if (users) tempEntities = tempEntities.concat(users.map((user) => user.id))
    return tempEntities
  }, [users])

  const { onChange, value: currentValue, required, label } = props

  const _onChange = (_event: React.SyntheticEvent<Element, Event>, newValues: string[]) => {
    onChange(newValues)
  }

  return (
    <Autocomplete
      multiple
      open={open}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={() => {
        setOpen(false)
      }}
      // we might get a string or an object back
      isOptionEqualToValue={(option: string, value: string) => option === value}
      getOptionLabel={(option) => option}
      value={currentValue || []}
      onChange={_onChange}
      options={entities || []}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label + (required ? ' *' : '')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
