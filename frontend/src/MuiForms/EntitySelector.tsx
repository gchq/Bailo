import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { debounce } from 'lodash-es'
import { KeyboardEvent, SyntheticEvent, useCallback, useMemo, useState } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import UserDisplay from 'src/common/UserDisplay'
import getCompareFieldState from 'src/hooks/useCompareField'
import { EntityObject } from 'types/types'

import { useGetCurrentUser, useListEntities } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorProps {
  label?: string
  required?: boolean
  value: string[] | string
  onChange: (newValue: string[] | string) => void
  registry?: Registry
  rawErrors?: string[]
  id: string
  schema: RJSFSchema
}

export function getEntitySelectorValue(
  selectedEntities: EntityObject[] | EntityObject,
  isMultiple: boolean,
): string[] | string {
  if (isMultiple) {
    const entities = Array.isArray(selectedEntities) ? selectedEntities : [selectedEntities]
    return entities.map((entity) => `${entity.kind}:${entity.id}`)
  }

  const entity = Array.isArray(selectedEntities) ? selectedEntities[0] : selectedEntities
  return `${entity.kind}:${entity.id}`
}

function formatEntityValue(value: string[] | string | undefined): string {
  if (!value || value.length === 0) {
    return ''
  }

  const entities = Array.isArray(value) ? value : [value]

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

  const isMultiple = schema.type === 'array'

  const theme = useTheme()

  const currentUserId = useMemo(() => (currentUser ? currentUser?.dn : ''), [currentUser])

  function defaultSelectedEntities(): EntityObject[] | EntityObject {
    if (!schema.hideDefaultUser) {
      const defaultEntity = { id: currentUserId, kind: 'user' }
      return isMultiple ? [defaultEntity] : defaultEntity
    }

    if (!currentValue) {
      return []
    }

    const values = Array.isArray(currentValue) ? currentValue : [currentValue]
    const entities = values.map((value) => {
      const [kind, id] = value.split(':')
      return { kind, id }
    })

    return isMultiple ? entities : entities[0]
  }

  const [selectedEntities, setSelectedEntities] = useState<EntityObject[] | EntityObject>(defaultSelectedEntities())

  const handleUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValue: EntityObject[] | EntityObject) => {
      onChange(getEntitySelectorValue(newValue, isMultiple))
      setSelectedEntities(newValue)
    },
    [isMultiple, onChange],
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

  const compare = getCompareFieldState<string[] | string>(id, registry.formContext)

  const formatEntity = (val?: unknown): string | undefined => formatEntityValue(val as string[] | string | undefined)

  if (isCurrentUserLoading) {
    return <Loading />
  }

  const currentValueString = formatEntityValue(currentValue)

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={currentValue}
      formatter={formatEntity}
      hasValue={Array.isArray(currentValue) || currentValue !== undefined}
    >
      {isUsersError && isUsersError.status === 413 && (
        <Typography color={theme.palette.error.main}>Too many results. Please refine your search.</Typography>
      )}
      {currentUser && compare.editMode ? (
        <>
          <Autocomplete<EntityObject, boolean, true>
            multiple={isMultiple}
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
            value={
              isMultiple
                ? Array.isArray(selectedEntities)
                  ? selectedEntities
                  : [selectedEntities]
                : Array.isArray(selectedEntities)
                  ? selectedEntities[0]
                  : selectedEntities
            }
            filterOptions={(x) => x}
            onChange={handleUserChange}
            noOptionsText={userListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
            onInputChange={debounceOnInputChange}
            options={users || []}
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
      ) : compare.inMirroredCompare && currentValue.length ? (
        <InlineDiff from={formatEntityValue(compare.compareFromState)} to={currentValueString} />
      ) : (
        currentValue &&
        currentValue.length > 0 && (
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {Array.isArray(currentValue) ? (
                currentValue.map((entity) => (
                  <Chip label={<UserDisplay dn={entity} />} key={entity} sx={{ width: 'fit-content' }} />
                ))
              ) : (
                <Chip label={<UserDisplay dn={currentValue} />} key={currentValue} sx={{ width: 'fit-content' }} />
              )}
            </Stack>
          </Box>
        )
      )}
    </CompareField>
  )
}
