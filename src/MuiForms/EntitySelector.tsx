import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import * as React from 'react'
import { useListUsers } from '../../data/user'
import { EntityKind } from '../../types/interfaces'

interface Entity {
  kind: string
  id: string
  data: unknown
}

type MinimalEntity = Omit<Entity, 'data'>

interface EntitySelectorProps {
  label?: string
  required?: boolean
  value: Array<Entity>
  onChange: (newValue: Array<MinimalEntity>) => void
}

export default function EntitySelector(props: EntitySelectorProps) {
  const { users, isUsersLoading: isLoading } = useListUsers()
  const [open, setOpen] = React.useState(false)

  const entities = React.useMemo(() => {
    let tempEntities: Array<Entity> = []

    if (users)
      tempEntities = tempEntities.concat(
        users.map((user) => ({
          kind: EntityKind.USER,
          id: user.id,
          data: user,
        }))
      )

    return tempEntities
  }, [users])

  const { onChange, value: currentValue, required, label } = props

  const _onChange = (_event: React.SyntheticEvent<Element, Event>, newValues: Array<MinimalEntity>) => {
    onChange(newValues.map((value) => ({ kind: value.kind, id: value.id })))
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
      isOptionEqualToValue={(option: Entity, value: Entity) => option.id === value.id}
      getOptionLabel={(option) => option.id}
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
