import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { debounce } from 'lodash-es'
import { KeyboardEvent, SyntheticEvent, useCallback, useMemo, useState } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import UserDisplay from 'src/common/UserDisplay'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { EntityObject } from 'types/types'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

import { useGetCurrentUser, useListEntities } from '../../actions/user'
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
  schema: RJSFSchema
}

function formatEntityValue(entities: string[] | undefined): string {
  if (!entities || entities.length === 0) {
    return ''
  }
  return entities
    .map((entity) => {
      const [, entityId] = entity.split(':')
      return entityId ?? entity
    })
    .join('\n')
}

export default function EntitySelector({
  onChange,
  value: currentValue,
  required,
  label,
  registry,
  rawErrors,
  id,
  schema,
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [userListQuery, setUserListQuery] = useState('')

  const { users, isUsersLoading, isUsersError } = useListEntities(userListQuery)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const theme = useTheme()

  const currentUserId = useMemo(() => (currentUser ? currentUser?.dn : ''), [currentUser])

  function defaultSelectedEntities(): EntityObject[] {
    if (registry && registry.formContext && registry.formContext.defaultCurrentUser) {
      return [{ id: currentUserId, kind: 'user' }]
    }
    if (currentValue) {
      const updatedEntities: EntityObject[] = currentValue.map((value) => {
        const [kind, id] = value.split(':')
        return { kind, id }
      })
      return updatedEntities
    }
    return []
  }

  const [selectedEntities, setSelectedEntities] = useState<EntityObject[]>(defaultSelectedEntities())

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

  const mirroredState = getMirroredState(id, registry.formContext)
  const compareFromState = getCompareFromState(id, registry.formContext) as string[] | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string[] | undefined
  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  const currentValueString = formatEntityValue(currentValue)
  const compareFromString = formatEntityValue(compareFromState)
  const mirroredStateString = formatEntityValue(mirroredState as string[] | undefined)
  const compareFromMirroredString = formatEntityValue(compareFromMirroredState)

  if (inCompareMode && !registry.formContext.mirroredModel) {
    const from = compareFromState ? compareFromString : mirroredStateString
    return (
      <Stack spacing={1}>
        <Typography
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
          sx={{ fontWeight: 'bold' }}
        >
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        <InlineDiff from={from} to={currentValueString} />
      </Stack>
    )
  }

  if (isCurrentUserLoading) {
    return <Loading />
  }

  const mirroredContent =
    inCompareMode && registry.formContext.mirroredModel ? (
      <InlineDiff from={compareFromMirroredString} to={mirroredStateString} />
    ) : (
      mirroredState
    )

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredContent}
      display={
        inCompareMode && registry.formContext.mirroredModel
          ? true
          : (registry.formContext.mirroredModel && currentValue.length > 0) || false
      }
      label={label}
      id={id}
      mirroredModel={registry.formContext.mirroredModel}
      required={required}
      description={schema.description}
    >
      {isUsersError && isUsersError.status === 413 && (
        <Typography color={theme.palette.error.main}>Too many results. Please refine your search.</Typography>
      )}
      {currentUser && registry.formContext.editMode ? (
        <>
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
            renderValue={(value, getTagProps) =>
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
      ) : inCompareMode && registry.formContext.mirroredModel ? (
        <InlineDiff from={compareFromString} to={currentValueString} />
      ) : currentValue.length > 0 ? (
        <Box sx={{ overflowX: 'auto', p: 1 }}>
          <Stack spacing={1} direction='row'>
            {currentValue.map((entity) => (
              <Chip label={<UserDisplay dn={entity} />} key={entity} sx={{ width: 'fit-content' }} />
            ))}
          </Stack>
        </Box>
      ) : (
        <Typography
          sx={{
            fontStyle: 'italic',
            color: theme.palette.customTextInput.main,
          }}
        >
          Unanswered
        </Typography>
      )}
    </AdditionalInformation>
  )
}
