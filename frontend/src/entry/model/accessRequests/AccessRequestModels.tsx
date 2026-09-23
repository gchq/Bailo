import { Autocomplete, Stack, TextField } from '@mui/material'
import { useListEntries } from 'actions/entry'
import MessageAlert from 'src/MessageAlert'
import { EntryKind } from 'types/types'

interface AccessRequestModelsProps {
  modelId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export default function AccessRequestModels({
  modelId,
  selectedIds,
  onChange,
  disabled = false,
}: AccessRequestModelsProps) {
  const { entries, isEntriesLoading, isEntriesError } = useListEntries([EntryKind.MODEL, EntryKind.MIRRORED_MODEL])
  const options = entries.filter((entry) => !entry.peerId && entry.id !== modelId)
  return (
    <Stack spacing={1}>
      <Autocomplete
        multiple
        filterSelectedOptions
        options={options}
        value={options.filter((entry) => selectedIds.includes(entry.id))}
        getOptionLabel={(entry) => entry.name}
        getOptionKey={(entry) => entry.id}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionDisabled={(option) => selectedIds.length >= 19 && !selectedIds.includes(option.id)}
        onChange={(_, selected) => onChange(selected.map((entry) => entry.id))}
        disabled={disabled || isEntriesLoading || !!isEntriesError}
        loading={isEntriesLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label='Also request access to'
            helperText='Optional. Select up to 19 additional models. Each model has its own request and review.'
          />
        )}
      />
      {isEntriesError && (
        <MessageAlert
          message='Additional models could not be loaded. You can still request access to this model.'
          severity='warning'
        />
      )}
    </Stack>
  )
}
