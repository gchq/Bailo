import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry } from '@rjsf/utils'
import { debounce } from 'lodash-es'
import { KeyboardEvent, SyntheticEvent, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { EntityObject } from 'types/types'

import { useGetCurrentUser, useListUsers } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  registry?: Registry
  rawErrors?: string[]
  id: string
}

export default function EntitySelector({
  onChange,
  value: currentValue,
  required,
  label,
  registry,
  rawErrors,
  id,
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [userListQuery, setUserListQuery] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<EntityObject[]>([])

  const { users, isUsersLoading, isUsersError } = useListUsers(userListQuery)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const theme = useTheme()

  const currentUserId = useMemo(() => (currentUser ? currentUser?.dn : ''), [currentUser])

  const onSelectedEntitiesChanged = useEffectEvent((newEntities: EntityObject[]) => {
    setSelectedEntities(newEntities)
  })

  useEffect(() => {
    if (registry && registry.formContext && registry.formContext.defaultCurrentUser) {
      onSelectedEntitiesChanged([{ id: currentUserId, kind: 'user' }])
    }
  }, [currentUserId, registry])

  useEffect(() => {
    if (currentValue) {
      const updatedEntities: EntityObject[] = currentValue.map((value) => {
        const [kind, id] = value.split(':')
        return { kind, id }
      })
      onSelectedEntitiesChanged(updatedEntities)
    }
  }, [currentValue])

  const handleUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValues: EntityObject[]) => {
      onChange(newValues.map((value) => `${value.kind}:${value.id}`))
      setSelectedEntities(newValues)
    },
    [onChange],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, [])

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  if (registry && !registry.formContext.editMode && registry.formContext.mirroredModel) {
    const mirroredState = id
      .replaceAll('root_', '')
      .replaceAll('_', '.')
      .split('.')
      .filter((t) => t !== '')
      .reduce((prev, cur) => prev && prev[cur], registry.formContext.mirroredState)
    return (
      <>
        <Typography fontWeight='bold' aria-label={`label for ${label}`}>
          {label}
        </Typography>
        {mirroredState ? (
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {mirroredState.map((entity) => (
                <Chip label={<UserDisplay dn={entity} />} key={entity} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        ) : (
          <Typography
            sx={{
              fontStyle: currentValue ? 'unset' : 'italic',
              color: currentValue ? theme.palette.common.black : theme.palette.customTextInput.main,
            }}
          >
            {currentValue ? currentValue : 'Unanswered'}
          </Typography>
        )}
        <AdditionalInformation>
          {currentValue ? (
            <Box sx={{ overflowX: 'auto', p: 1 }}>
              <Stack spacing={1} direction='row'>
                {currentValue.map((entity) => (
                  <Chip label={<UserDisplay dn={entity} />} key={entity} sx={{ width: 'fit-content' }} />
                ))}
              </Stack>
            </Box>
          ) : undefined}
        </AdditionalInformation>
      </>
    )
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  if (isUsersError) {
    if (isUsersError.status !== 413) {
      return <MessageAlert message={isUsersError.info.message} severity='error' />
    }
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      {isUsersError && isUsersError.status === 413 && (
        <Typography color={theme.palette.error.main}>Too many results. Please refine your search.</Typography>
      )}
      {currentUser && registry.formContext && registry.formContext.editMode && (
        <>
          <Typography fontWeight='bold' aria-label={`label for ${label}`} component='label' htmlFor={id}>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          <Autocomplete<EntityObject, true, true>
            multiple
            data-test='entitySelector'
            loading={userListQuery.length > 3 && isUsersLoading}
            open={open}
            size='small'
            onOpen={() => {
              setOpen(true)
            }}
            onClose={() => {
              setOpen(false)
            }}
            disableClearable
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.id}
            value={selectedEntities || []}
            filterOptions={(x) => x}
            onChange={handleUserChange}
            noOptionsText={userListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
            onInputChange={debounceOnInputChange}
            options={users || []}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Box key={option.id} sx={{ maxWidth: '200px' }}>
                  <Chip
                    {...getTagProps({ index })}
                    sx={{ textOverflow: 'ellipsis' }}
                    label={<UserDisplay dn={option.id} />}
                  />
                </Box>
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder='Username or group name'
                slotProps={{
                  htmlInput: { 'aria-label': `input field for ${label}` },
                }}
                error={rawErrors && rawErrors.length > 0}
                id={id}
                onKeyDown={(event: KeyboardEvent) => {
                  if (event.key === 'Backspace') {
                    event.stopPropagation()
                  }
                }}
              />
            )}
          />
        </>
      )}
      {registry.formContext && !registry.formContext.editMode && (
        <>
          <Typography fontWeight='bold' aria-label={`label for ${label}`}>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
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
                <Chip label={<UserDisplay dn={entity} />} key={entity} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
