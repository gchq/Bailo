import { Box, Chip, Stack } from '@mui/material'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { useCallback, useMemo, useState } from 'react'
import CompareField from 'src/common/CompareField'
import EntityAutocomplete from 'src/common/EntityAutocomplete'
import InlineDiff from 'src/common/InlineDiff'
import UserDisplay from 'src/common/UserDisplay'
import getCompareFieldState from 'src/hooks/useCompareField'
import { EntityObject } from 'types/types'

import { useGetCurrentUser } from '../../actions/user'
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
  selectedEntities: EntityObject[] | EntityObject | null | undefined,
  isMultiple: boolean,
): string[] | string {
  if (isMultiple) {
    const entities = (Array.isArray(selectedEntities) ? selectedEntities : [selectedEntities]).filter(
      (entity): entity is EntityObject => entity !== null && entity !== undefined,
    )
    return entities.map((entity) => `${entity.kind}:${entity.id}`)
  }

  if (!selectedEntities) {
    return ''
  }

  const entity = Array.isArray(selectedEntities) ? selectedEntities[0] : selectedEntities
  if (!entity) {
    return ''
  }

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
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const isMultiple = schema.type === 'array'

  const normalisedValue = useMemo<string[] | string>(() => {
    if (!isMultiple) {
      return currentValue
    }
    return (Array.isArray(currentValue) ? currentValue : [currentValue]).filter(Boolean)
  }, [isMultiple, currentValue])

  const currentUserId = useMemo(() => (currentUser ? currentUser?.dn : ''), [currentUser])

  function defaultSelectedEntities(): EntityObject[] | EntityObject {
    if (!schema.hideDefaultUser) {
      const defaultEntity = { id: currentUserId, kind: 'user' }
      return isMultiple ? [defaultEntity] : defaultEntity
    }

    if (!normalisedValue || normalisedValue.length === 0) {
      return []
    }

    const values = Array.isArray(normalisedValue) ? normalisedValue : [normalisedValue]
    const entities = values.map((value) => {
      const [kind, id] = value.split(':')
      return { kind, id }
    })

    return isMultiple ? entities : entities[0]
  }

  const [selectedEntities, setSelectedEntities] = useState<EntityObject[] | EntityObject>(defaultSelectedEntities())

  const handleUserChange = useCallback(
    (newValue: EntityObject[] | EntityObject) => {
      onChange(getEntitySelectorValue(newValue, isMultiple))
      setSelectedEntities(newValue)
    },
    [isMultiple, onChange],
  )

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const compare = getCompareFieldState<string[] | string>(id, registry.formContext)

  const formatEntity = (val?: unknown): string | undefined => formatEntityValue(val as string[] | string | undefined)

  if (isCurrentUserLoading) {
    return <Loading />
  }

  const currentValueString = formatEntityValue(normalisedValue)

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={normalisedValue}
      formatter={formatEntity}
      hasValue={Array.isArray(normalisedValue) ? normalisedValue.length > 0 : normalisedValue !== undefined}
    >
      {currentUser && compare.editMode ? (
        <EntityAutocomplete
          id={id}
          multiple={isMultiple}
          dataTest='entitySelector'
          value={selectedEntities}
          onChange={handleUserChange}
          maxItems={schema.maxItems}
          disableClearable
          error={Boolean(rawErrors?.length)}
        />
      ) : compare.inMirroredCompare && normalisedValue.length ? (
        <InlineDiff from={formatEntityValue(compare.compareFromState)} to={currentValueString} />
      ) : normalisedValue && normalisedValue.length > 0 ? (
        <Box sx={{ overflowX: 'auto', p: 1 }}>
          <Stack spacing={1} direction='row'>
            {Array.isArray(normalisedValue) ? (
              normalisedValue.map((entity) => (
                <Chip label={<UserDisplay dn={entity} />} key={entity} sx={{ width: 'fit-content' }} />
              ))
            ) : (
              <Chip label={<UserDisplay dn={normalisedValue} />} key={normalisedValue} sx={{ width: 'fit-content' }} />
            )}
          </Stack>
        </Box>
      ) : (
        <Typography component='span' sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
          None
        </Typography>
      )}
    </CompareField>
  )
}
