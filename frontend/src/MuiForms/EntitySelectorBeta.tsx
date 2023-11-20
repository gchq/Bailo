import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { FormContextType } from '@rjsf/utils'
import { debounce } from 'lodash'
import { KeyboardEvent, SyntheticEvent, useCallback, useMemo, useState } from 'react'

import { useGetCurrentUser, useListUsers } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorBetaProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  formContext?: FormContextType
}

export default function EntitySelectorBeta(props: EntitySelectorBetaProps) {
  const { onChange, value: currentValue, required, label, formContext } = props

  const [open, setOpen] = useState(false)
  const [userListQuery, setUserListQuery] = useState('')

  const { users, isUsersLoading: isLoading } = useListUsers(userListQuery)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const theme = useTheme()

  const entities = useMemo(() => {
    if (!users) return []

    const userGroup = users.find((usrGroup) => usrGroup.kind === 'user')
    if (userGroup) {
      return userGroup.entities.map((entity) => entity.split(':')[1])
    } else {
      return []
    }
  }, [users])

  const handleUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValues: string[]) => {
      onChange(newValues)
    },
    [onChange],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, [])

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      {currentUser && formContext && formContext.editMode && (
        <Autocomplete
          multiple
          open={open}
          size='small'
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
          onChange={handleUserChange}
          noOptionsText={userListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
          onInputChange={debounceOnInputChange}
          options={entities || []}
          loading={isLoading}
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
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>{label}</Typography>
          {currentValue.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {currentValue.map((entity) => (
                <Chip label={entity} key={entity} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
