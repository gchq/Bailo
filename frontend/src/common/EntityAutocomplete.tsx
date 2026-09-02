import { Autocomplete, TextField, Typography } from '@mui/material'
import { useListEntities } from 'actions/user'
import { KeyboardEvent, SyntheticEvent, useState } from 'react'
import useDebounce from 'src/hooks/useDebounce'
import { EntityObject } from 'types/types'

interface EntityAutocompleteProps {
  id?: string
  label?: string
  multiple?: boolean
  value: EntityObject | EntityObject[] | null
  onChange: (value: EntityObject | EntityObject[]) => void
  onLimitReached?: () => void
  maxItems?: number
  error?: boolean
  disableClearable?: boolean
  dataTest?: string
}

export function entityToDn(entity: EntityObject): string {
  return `${entity.kind}:${entity.id}`
}

export function dnToEntity(value: string): EntityObject {
  const [kind, ...idParts] = value.split(':')
  return { kind, id: idParts.join(':') }
}

export default function EntityAutocomplete({
  id,
  label,
  multiple = false,
  value,
  onChange,
  onLimitReached,
  maxItems,
  error = false,
  disableClearable = false,
  dataTest,
}: EntityAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const { users, isUsersLoading, isUsersError } = useListEntities(debouncedQuery)
  const selected = Array.isArray(value) ? value : value ? [value] : []
  const atLimit = maxItems !== undefined && selected.length >= maxItems

  return (
    <>
      {isUsersError?.status === 413 && (
        <Typography color='error'>Too many results. Please refine your search.</Typography>
      )}
      <Autocomplete<EntityObject, boolean, boolean>
        multiple={multiple}
        data-test={dataTest}
        loading={debouncedQuery.length >= 3 && isUsersLoading}
        open={open}
        size='small'
        onOpen={() => !atLimit && setOpen(true)}
        onClose={() => setOpen(false)}
        disableClearable={disableClearable}
        isOptionEqualToValue={(option, selectedValue) => entityToDn(option) === entityToDn(selectedValue)}
        getOptionLabel={(option) => option.id}
        value={multiple ? selected : (selected[0] ?? null)}
        filterOptions={(options) => options}
        onChange={(_event, newValue) => {
          const normalisedValue = Array.isArray(newValue) ? newValue : newValue ? [newValue] : []
          onChange(multiple ? normalisedValue : normalisedValue[0])
          if (maxItems !== undefined && normalisedValue.length >= maxItems) {
            setOpen(false)
            onLimitReached?.()
          }
        }}
        noOptionsText={query.length < 3 ? 'Please enter at least three characters' : 'No options'}
        onInputChange={(_event: SyntheticEvent, inputValue) => setQuery(inputValue)}
        options={users || []}
        renderInput={(params) => (
          <TextField
            {...params}
            id={id}
            label={label}
            placeholder='Username or group name'
            error={error}
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === 'Backspace') {
                event.stopPropagation()
              }
            }}
          />
        )}
      />
    </>
  )
}
