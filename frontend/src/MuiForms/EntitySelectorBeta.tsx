import { Chip } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import * as React from 'react'

import { useGetCurrentUser, useListUsers } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
}

export default function EntitySelectorBeta(props: EntitySelectorProps) {
  const { users, isUsersLoading: isLoading } = useListUsers()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
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

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      {currentUser && (
        <Autocomplete
          multiple
          open={open}
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          clearIcon={false}
          // we might get a string or an object back
          isOptionEqualToValue={(option: string, value: string) => option === value}
          getOptionLabel={(option) => option}
          value={currentValue || []}
          onChange={_onChange}
          options={entities || []}
          loading={isLoading}
          getOptionDisabled={(option) => option === currentUser.id}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              // eslint-disable-next-line react/jsx-key
              <Chip label={option} {...getTagProps({ index })} disabled={option === currentUser.id} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={label + (required ? ' *' : '')}
              onKeyDown={(event: any) => {
                if (event.key === 'Backspace') {
                  event.stopPropagation()
                }
              }}
            />
          )}
        />
      )}
    </>
  )
}
