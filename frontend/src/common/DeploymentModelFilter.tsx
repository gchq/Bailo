import { Autocomplete, Typography } from '@mui/material'
import { type EntrySearchResult, useListEntries } from 'actions/entry'
import { useContext, useMemo } from 'react'
import LimitedTextField from 'src/common/LimitedTextField'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { EntryKind } from 'types/types'

interface DeploymentModelFilterProps {
  selectedModelIds: string[]
  onChange: (modelIds: string[]) => void
}

export default function DeploymentModelFilter({ selectedModelIds, onChange }: DeploymentModelFilterProps) {
  const uiConfig = useContext(UiConfigContext)
  const { entries, isEntriesLoading, isEntriesError } = useListEntries({
    kind: EntryKind.MODEL,
    roles: [],
    task: '',
    libraries: [],
    organisations: [],
    states: uiConfig.deploymentAssessments.deployableModelState
      ? [uiConfig.deploymentAssessments.deployableModelState]
      : undefined,
    peers: [],
    users: [],
    search: '',
    allowTemplating: false,
    schemaId: undefined,
    titleOnly: true,
    adminAccess: false,
    visibility: 'public',
    enabled: true,
  })

  const options = useMemo(() => {
    const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
    const unresolved = selectedModelIds
      .filter((id) => !entriesById.has(id))
      .map((id): EntrySearchResult => ({
        id,
        name: id,
        description: '',
        tags: [],
        kind: EntryKind.MODEL,
        visibility: 'public',
        createdAt: new Date(0),
        updatedAt: new Date(0),
      }))
    return [...entries, ...unresolved]
  }, [entries, selectedModelIds])

  const selectedModels = useMemo(
    () => selectedModelIds.map((id) => options.find((entry) => entry.id === id)).filter((entry) => entry !== undefined),
    [options, selectedModelIds],
  )

  return (
    <>
      <Autocomplete<EntrySearchResult, true>
        multiple
        data-test='deploymentAssessmentModelFilter'
        size='small'
        options={options}
        loading={isEntriesLoading}
        value={selectedModels}
        limitTags={3}
        getOptionLabel={(model) => model.name}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        onChange={(_event, selected) => onChange(selected.map((model) => model.id))}
        renderInput={(params) => <LimitedTextField {...params} label='Models' placeholder='Select models' />}
        slotProps={{ chip: { size: 'small' } }}
      />
      {isEntriesError && (
        <Typography variant='caption' color='error'>
          {isEntriesError.info.message}
        </Typography>
      )}
    </>
  )
}
