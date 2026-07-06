import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { Alert, Autocomplete, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { EntrySearchResult, useListEntries } from 'actions/entry'
import { useGetEntryCard, useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import {
  EntryCardRevisionInterface,
  EntryKind,
  EntryKindKeys,
  EntryKindLabel,
  MODEL_ENTRY_KINDS,
  SplitSchemaNoRender,
} from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { formatDateString } from 'utils/dateUtils'
import { getStepsFromSchema } from 'utils/formUtils'
import { entryKindForRedirect, updateQuery } from 'utils/routerUtils'
import { toTitleCase } from 'utils/stringUtils'

const QueryDiffSide = {
  To: 'to',
  From: 'from',
} as const

type QueryDiffSide = (typeof QueryDiffSide)[keyof typeof QueryDiffSide]

const QueryCardType = {
  Standard: 'Version',
  Mirror: 'MirroredVersion',
} as const

type QueryCardType = (typeof QueryCardType)[keyof typeof QueryCardType]

type EntryCardCompareProps = {
  entryKind: EntryKindKeys
  fromEntryId?: string
  fromVersion?: number
  fromMirroredVersion?: number
  toEntryId?: string
  toVersion?: number
  toMirroredVersion?: number
}

export default function EntryCardCompare({
  entryKind,
  fromEntryId,
  fromVersion,
  fromMirroredVersion,
  toEntryId,
  toVersion,
  toMirroredVersion,
}: EntryCardCompareProps) {
  const router = useRouter()

  const [fromSearch, setFromSearch] = useState('')
  const [toSearch, setToSearch] = useState('')

  const searchKinds = entryKind === EntryKind.MODEL ? MODEL_ENTRY_KINDS : entryKind

  const { entries: fromEntriesRaw, isEntriesLoading: isFromEntriesLoading } = useListEntries(
    searchKinds,
    [],
    '',
    [],
    [],
    [],
    [],
    fromSearch,
    undefined,
    undefined,
    true,
  )
  const { entries: toEntriesRaw, isEntriesLoading: isToEntriesLoading } = useListEntries(
    searchKinds,
    [],
    '',
    [],
    [],
    [],
    [],
    toSearch,
    undefined,
    undefined,
    true,
  )

  const fromEntries = fromEntriesRaw
  const toEntries = toEntriesRaw

  const fromEntry = useMemo(
    () => (fromEntryId ? fromEntries.find((entry) => entry.id === fromEntryId) : undefined),
    [fromEntries, fromEntryId],
  )
  const toEntry = useMemo(
    () => (toEntryId ? toEntries.find((entry) => entry.id === toEntryId) : undefined),
    [toEntries, toEntryId],
  )

  const {
    entryCardRevisions: fromRevisions,
    isEntryCardRevisionsLoading: isFromRevisionsLoading,
    isEntryCardRevisionsError: isFromRevisionsError,
  } = useGetEntryCardRevisions(fromEntryId)
  const {
    entryCardRevisions: toRevisions,
    isEntryCardRevisionsLoading: isToRevisionsLoading,
    isEntryCardRevisionsError: isToRevisionsError,
  } = useGetEntryCardRevisions(toEntryId)

  const {
    entryCard: fromLocalCard,
    isEntryCardLoading: isFromLocalLoading,
    isEntryCardError: isFromLocalError,
  } = useGetEntryCard(fromEntryId, fromVersion, false)
  const {
    entryCard: toLocalCard,
    isEntryCardLoading: isToLocalLoading,
    isEntryCardError: isToLocalError,
  } = useGetEntryCard(toEntryId, toVersion, false)
  const {
    entryCard: fromMirroredCard,
    isEntryCardLoading: isFromMirroredLoading,
    isEntryCardError: isFromMirroredError,
  } = useGetEntryCard(fromEntryId, fromMirroredVersion, true)
  const {
    entryCard: toMirroredCard,
    isEntryCardLoading: isToMirroredLoading,
    isEntryCardError: isToMirroredError,
  } = useGetEntryCard(toEntryId, toMirroredVersion, true)

  const hasLocalPair = !!fromLocalCard && !!toLocalCard
  const hasMirroredPair = !!fromMirroredCard && !!toMirroredCard

  const localSchemaId =
    hasLocalPair && fromLocalCard.schemaId === toLocalCard.schemaId ? toLocalCard.schemaId : undefined
  const mirroredSchemaId =
    hasMirroredPair && fromMirroredCard.schemaId === toMirroredCard.schemaId ? toMirroredCard.schemaId : undefined
  const chosenSchemaId = localSchemaId ?? mirroredSchemaId

  const {
    schema: chosenSchema,
    isSchemaLoading: isSchemaLoading,
    isSchemaError: isSchemaError,
  } = useGetSchema(chosenSchemaId ?? '')

  // First versions are non comparable since they have no content
  const sortedFromLocalRevisions = useMemo(
    () =>
      [...fromRevisions]
        .filter((revision) => revision.version !== 1 && !revision.mirrored)
        .sort(sortByCreatedAtDescending),
    [fromRevisions],
  )
  const sortedFromMirroredRevisions = useMemo(
    () =>
      [...fromRevisions]
        .filter((revision) => revision.version !== 1 && revision.mirrored)
        .sort(sortByCreatedAtDescending),
    [fromRevisions],
  )
  const sortedToLocalRevisions = useMemo(
    () =>
      [...toRevisions]
        .filter((revision) => revision.version !== 1 && !revision.mirrored)
        .sort(sortByCreatedAtDescending),
    [toRevisions],
  )
  const sortedToMirroredRevisions = useMemo(
    () =>
      [...toRevisions]
        .filter((revision) => revision.version !== 1 && revision.mirrored)
        .sort(sortByCreatedAtDescending),
    [toRevisions],
  )

  const useMirroredLayout = hasMirroredPair

  const initialSplit = useMemo<SplitSchemaNoRender>(() => {
    if (!chosenSchema) {
      return { reference: '', steps: [] }
    }
    const toState = toLocalCard?.metadata ?? {}
    const fromState = fromLocalCard?.metadata ?? {}
    const toMirroredState = toMirroredCard?.metadata ?? {}
    const fromMirroredState = fromMirroredCard?.metadata ?? {}
    const steps = getStepsFromSchema(
      chosenSchema,
      {},
      ['properties.contacts'],
      toState,
      toMirroredState,
      hasLocalPair ? fromState : undefined,
      hasMirroredPair ? fromMirroredState : undefined,
    )
    for (const step of steps) {
      step.steps = steps
    }
    return { reference: chosenSchema.id, steps }
  }, [
    chosenSchema,
    fromLocalCard?.metadata,
    fromMirroredCard?.metadata,
    hasLocalPair,
    hasMirroredPair,
    toLocalCard?.metadata,
    toMirroredCard?.metadata,
  ])

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>(initialSplit)
  const [lastKey, setLastKey] = useState<string | undefined>(undefined)
  const currentKey = chosenSchemaId
    ? [
        chosenSchemaId,
        fromEntryId,
        fromLocalCard?.version,
        fromMirroredCard?.version,
        toEntryId,
        toLocalCard?.version,
        toMirroredCard?.version,
      ].join(':')
    : undefined
  if (currentKey && currentKey !== lastKey) {
    setLastKey(currentKey)
    setSplitSchema(initialSplit)
  }

  const setModel = (side: QueryDiffSide, model: EntrySearchResult | null) => {
    if (side === QueryDiffSide.From) {
      updateQuery(router, { fromModel: model?.id, fromVersion: undefined, fromMirroredVersion: undefined })
    } else {
      updateQuery(router, { toModel: model?.id, toVersion: undefined, toMirroredVersion: undefined })
    }
  }

  const setVersion = (side: QueryDiffSide, cardType: QueryCardType, version?: number) => {
    const key = `${side}${cardType}`
    updateQuery(router, { [key]: version === undefined ? undefined : String(version) })
  }

  const error = MultipleErrorWrapper(`Unable to load compare page`, {
    isFromRevisionsError,
    isToRevisionsError,
    isFromLocalError,
    isToLocalError,
    isFromMirroredError,
    isToMirroredError,
    isSchemaError,
  })
  if (error) {
    return error
  }

  const loading =
    (fromEntryId !== undefined &&
      (isFromRevisionsLoading ||
        (fromVersion !== undefined && isFromLocalLoading) ||
        (fromMirroredVersion !== undefined && isFromMirroredLoading))) ||
    (toEntryId !== undefined &&
      (isToRevisionsLoading ||
        (toVersion !== undefined && isToLocalLoading) ||
        (toMirroredVersion !== undefined && isToMirroredLoading))) ||
    (!!chosenSchemaId && isSchemaLoading)

  const renderVersionLabel = (revision: EntryCardRevisionInterface) =>
    `Updated by ${revision.createdBy} on ${formatDateString(revision.createdAt)}`

  const renderEntryLabel = (entry: EntrySearchResult) => `${entry.name} (${entry.id})`

  const fromLocalOption = sortedFromLocalRevisions.find((revision) => revision.version === fromVersion) ?? null
  const fromMirroredOption =
    sortedFromMirroredRevisions.find((revision) => revision.version === fromMirroredVersion) ?? null
  const toLocalOption = sortedToLocalRevisions.find((revision) => revision.version === toVersion) ?? null
  const toMirroredOption = sortedToMirroredRevisions.find((revision) => revision.version === toMirroredVersion) ?? null

  const fromHasMirroredRevisions = sortedFromMirroredRevisions.length > 0
  const toHasMirroredRevisions = sortedToMirroredRevisions.length > 0

  const kindLabel = EntryKindLabel[entryKind]
  const backHref = `/${entryKindForRedirect(entryKind)}/${fromEntryId}`

  const hasAnyVersionFrom = !!fromEntryId && (fromVersion !== undefined || fromMirroredVersion !== undefined)
  const hasAnyVersionTo = !!toEntryId && (toVersion !== undefined || toMirroredVersion !== undefined)

  const localSchemasDiverge = hasLocalPair && fromLocalCard.schemaId !== toLocalCard.schemaId
  const mirroredSchemasDiverge = hasMirroredPair && fromMirroredCard.schemaId !== toMirroredCard.schemaId
  const schemasDiverge = localSchemasDiverge || mirroredSchemasDiverge

  const canRenderForm = !loading && !!chosenSchema && splitSchema.steps.length > 0 && !schemasDiverge

  return (
    <Container>
      <Paper sx={{ p: 4, my: 4 }}>
        <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBackIosIcon />} onClick={() => router.push(backHref)}>
            {`Back to ${kindLabel}`}
          </Button>
          <Typography variant='h6' component='h1' color='primary'>
            {`Compare ${toTitleCase(kindLabel)} Cards`}
          </Typography>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch', mb: 3 }}>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 'bold' }}>From</Typography>
            <Autocomplete
              disablePortal
              options={fromEntries}
              loading={isFromEntriesLoading}
              fullWidth
              size='small'
              value={fromEntry ?? null}
              getOptionLabel={renderEntryLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input') {
                  setFromSearch(value)
                }
              }}
              onChange={(_event, value) => setModel(QueryDiffSide.From, value)}
              renderInput={(params) => <TextField {...params} label={`${kindLabel}`} />}
            />
            <Autocomplete
              disablePortal
              options={sortedFromLocalRevisions.filter((revision) => revision.version !== 1)}
              disabled={!fromEntryId}
              loading={isFromRevisionsLoading}
              fullWidth
              size='small'
              value={fromLocalOption}
              getOptionLabel={renderVersionLabel}
              isOptionEqualToValue={(option, value) => option.version === value.version}
              onChange={(_event, value) => setVersion(QueryDiffSide.From, QueryCardType.Standard, value?.version)}
              renderInput={(params) => <TextField {...params} label='Version' />}
            />
            {fromHasMirroredRevisions && (
              <Autocomplete
                disablePortal
                options={sortedFromMirroredRevisions}
                disabled={!fromEntryId}
                loading={isFromRevisionsLoading}
                fullWidth
                size='small'
                value={fromMirroredOption}
                getOptionLabel={renderVersionLabel}
                isOptionEqualToValue={(option, value) => option.version === value.version}
                onChange={(_event, value) => setVersion(QueryDiffSide.From, QueryCardType.Mirror, value?.version)}
                renderInput={(params) => <TextField {...params} label='Mirrored Version' />}
              />
            )}
          </Stack>
          <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <CompareArrowsIcon color='primary' fontSize='large' />
          </Stack>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 'bold' }}>To</Typography>
            <Autocomplete
              disablePortal
              options={toEntries}
              loading={isToEntriesLoading}
              fullWidth
              size='small'
              value={toEntry ?? null}
              getOptionLabel={renderEntryLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input') {
                  setToSearch(value)
                }
              }}
              onChange={(_event, value) => setModel(QueryDiffSide.To, value)}
              renderInput={(params) => <TextField {...params} label={`${kindLabel}`} />}
            />
            <Autocomplete
              disablePortal
              options={sortedToLocalRevisions}
              disabled={!toEntryId}
              loading={isToRevisionsLoading}
              fullWidth
              size='small'
              value={toLocalOption}
              getOptionLabel={renderVersionLabel}
              isOptionEqualToValue={(option, value) => option.version === value.version}
              onChange={(_event, value) => setVersion(QueryDiffSide.To, QueryCardType.Standard, value?.version)}
              renderInput={(params) => <TextField {...params} label='Version' />}
            />
            {toHasMirroredRevisions && (
              <Autocomplete
                disablePortal
                options={sortedToMirroredRevisions}
                disabled={!toEntryId}
                loading={isToRevisionsLoading}
                fullWidth
                size='small'
                value={toMirroredOption}
                getOptionLabel={renderVersionLabel}
                isOptionEqualToValue={(option, value) => option.version === value.version}
                onChange={(_event, value) => setVersion(QueryDiffSide.To, QueryCardType.Mirror, value?.version)}
                renderInput={(params) => <TextField {...params} label='Mirrored Version' />}
              />
            )}
          </Stack>
        </Stack>
        {loading && <Loading />}
        {!loading && (!hasAnyVersionFrom || !hasAnyVersionTo) && (
          <Alert severity='info'>
            Select a {kindLabel.toLowerCase()} and at least one version on both sides to view a diff.
          </Alert>
        )}
        {!loading && schemasDiverge && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            The selected revisions use different schemas and cannot be compared.
          </Alert>
        )}
        {canRenderForm && (
          <JsonSchemaForm
            splitSchema={splitSchema}
            setSplitSchema={setSplitSchema}
            canEdit={false}
            compareMode
            mirroredModel={useMirroredLayout}
          />
        )}
      </Paper>
    </Container>
  )
}
