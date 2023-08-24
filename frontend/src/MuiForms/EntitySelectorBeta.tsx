import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import * as React from 'react'
import Loading from 'src/common/Loading'

import { useListUsers } from '../../data/user'
import { EntityKind } from '../../types/types'

export interface Entity {
  kind: string
  id: string
  data?: unknown
}

type MinimalEntity = Omit<Entity, 'data'>

interface EntitySelectorProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
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

  const { onChange, value: currentValue, label, formContext } = props

  const _onChange = (_event: React.SyntheticEvent<Element, Event>, newValues: Array<MinimalEntity>) => {
    onChange(newValues.map((value) => ({ kind: value.kind, id: value.id })))
  }

  const theme = useTheme()

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
      popupIcon={!formContext.editMode ? <div></div> : <ExpandMoreIcon />}
      disabled={!formContext.editMode}
      renderInput={(params) => (
        <TextField
          {...params}
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
          variant={!formContext.editMode ? 'standard' : 'outlined'}
          label={label}
          required={!formContext.editMode ? false : true}
          InputProps={{
            ...params.InputProps,
            disableUnderline: !formContext.editMode ? true : false,
            endAdornment: (
              <>
                {isLoading ? <Loading /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
