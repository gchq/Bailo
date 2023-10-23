import { Chip } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { KeyboardEvent, SyntheticEvent, useMemo, useState } from 'react'

import { useGetCurrentUser, useListUsers } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorBetaProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
}

export default function EntitySelectorBeta(props: EntitySelectorBetaProps) {
  const { users, isUsersLoading: isLoading } = useListUsers()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [open, setOpen] = useState(false)

  const entities = useMemo(() => {
    if (!users) return []

    return users.map((user) => user.id)
  }, [users])

  const { onChange, value: currentValue, required, label } = props

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValues: string[]) => {
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
          onChange={handleChange}
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
              onKeyDown={(event: KeyboardEvent) => {
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
