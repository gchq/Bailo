import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { Alert, Autocomplete, Container, Fab, Link, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { EntrySearchResult, useListEntries } from 'actions/entry'
import { useGetEntryCard, useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
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
import { formatDateTimeString } from 'utils/dateUtils'
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

const RevisionDetails = ({ revision }: { revision?: EntryCardRevisionInterface | null }) => {
  if (!revision) {
    return null
  }

  return (
    <Stack direction='row' spacing={0.5} sx={{ minHeight: 20, alignItems: 'center' }}>
      <Typography component='span' variant='caption'>
        Updated by
      </Typography>
      <UserDisplay dn={revision.createdBy} />
      <Typography component='span' variant='caption'>
        on
      </Typography>
      <Typography component='span' variant='caption' sx={{ fontWeight: 'bold' }}>
        {formatDateTimeString(revision.createdAt)}
      </Typography>
    </Stack>
  )
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

  const hasFromCard = !!fromLocalCard || !!fromMirroredCard
  const hasToCard = !!toLocalCard || !!toMirroredCard
  const fromOnly = hasFromCard && !hasToCard

  const previewCard = fromLocalCard ?? fromMirroredCard

  const localSchemaId =
    hasLocalPair && fromLocalCard.schemaId === toLocalCard.schemaId ? toLocalCard.schemaId : undefined
  const mirroredSchemaId =
    hasMirroredPair && fromMirroredCard.schemaId === toMirroredCard.schemaId ? toMirroredCard.schemaId : undefined

  const singleSideSchemaId = fromOnly ? previewCard?.schemaId : undefined
  const chosenSchemaId = localSchemaId ?? mirroredSchemaId ?? singleSideSchemaId

  const {
    schema: chosenSchema,
    isSchemaLoading: isSchemaLoading,
    isSchemaError: isSchemaError,
  } = useGetSchema(chosenSchemaId ?? '')

  const sortedFromLocalRevisions = useMemo(
    () => [...fromRevisions].filter((revision) => !revision.mirrored).sort(sortByCreatedAtDescending),
    [fromRevisions],
  )
  const sortedFromMirroredRevisions = useMemo(
    () => [...fromRevisions].filter((revision) => revision.mirrored).sort(sortByCreatedAtDescending),
    [fromRevisions],
  )
  const sortedToLocalRevisions = useMemo(
    () => [...toRevisions].filter((revision) => !revision.mirrored).sort(sortByCreatedAtDescending),
    [toRevisions],
  )
  const sortedToMirroredRevisions = useMemo(
    () => [...toRevisions].filter((revision) => revision.mirrored).sort(sortByCreatedAtDescending),
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
    const steps = fromOnly
      ? getStepsFromSchema(chosenSchema, {}, ['properties.contacts'], fromState, fromMirroredState)
      : getStepsFromSchema(
          chosenSchema,
          {},
          ['properties.contacts'],
          toState,
          toMirroredState,
          fromState,
          fromMirroredState,
        )
    for (const step of steps) {
      step.steps = steps
    }
    return { reference: chosenSchema.id, steps }
  }, [
    chosenSchema,
    fromLocalCard?.metadata,
    fromMirroredCard?.metadata,
    fromOnly,
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
        fromOnly ? 'single' : 'diff',
      ].join(':')
    : undefined

  if (currentKey && currentKey !== lastKey) {
    setLastKey(currentKey)
  }

  const setModel = (side: QueryDiffSide, model: EntrySearchResult | null) => {
    if (side === QueryDiffSide.From) {
      updateQuery(router, { fromEntry: model?.id, fromVersion: undefined, fromMirroredVersion: undefined })
    } else {
      updateQuery(router, { toEntry: model?.id, toVersion: undefined, toMirroredVersion: undefined })
    }
  }

  const setVersion = (side: QueryDiffSide, cardType: QueryCardType, version?: number) => {
    const key = `${side}${cardType}`
    updateQuery(router, { [key]: version === undefined ? undefined : String(version) })
  }

  useEffect(() => {
    setSplitSchema(initialSplit)
  }, [initialSplit])

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

  const renderVersionLabel = (revision: EntryCardRevisionInterface) => `Version ${revision.version}`

  const renderEntryLabel = (entry: EntrySearchResult) => `${entry.name} (${entry.id})`

  const fromLocalOption = sortedFromLocalRevisions.find((revision) => revision.version === fromVersion) ?? null
  const fromMirroredOption =
    sortedFromMirroredRevisions.find((revision) => revision.version === fromMirroredVersion) ?? null
  const toLocalOption = sortedToLocalRevisions.find((revision) => revision.version === toVersion) ?? null
  const toMirroredOption = sortedToMirroredRevisions.find((revision) => revision.version === toMirroredVersion) ?? null

  const fromHasMirroredRevisions = sortedFromMirroredRevisions.length > 0
  const toHasMirroredRevisions = sortedToMirroredRevisions.length > 0

  const sameEntrySelected = !!fromEntryId && fromEntryId === toEntryId

  const isToLocalOptionDisabled = (revision: EntryCardRevisionInterface) =>
    sameEntrySelected && fromVersion !== undefined && revision.version === fromVersion

  const isFromLocalOptionDisabled = (revision: EntryCardRevisionInterface) =>
    sameEntrySelected && toVersion !== undefined && revision.version === toVersion

  const isToMirroredOptionDisabled = (revision: EntryCardRevisionInterface) =>
    sameEntrySelected && fromMirroredVersion !== undefined && revision.version === fromMirroredVersion

  const kindLabel = EntryKindLabel[entryKind]

  const renderGotoEntryButton = (entry?: EntrySearchResult) => {
    const href = entry ? `/${entryKindForRedirect(entry.kind)}/${entry.id}` : undefined

    return (
      <Link sx={{ fontWeight: 'bold' }} href={href}>
        {entry && entry.name}
      </Link>
    )
  }

  const hasAnyVersionFrom = !!fromEntryId && (fromVersion !== undefined || fromMirroredVersion !== undefined)
  const hasAnyVersionTo = !!toEntryId && (toVersion !== undefined || toMirroredVersion !== undefined)

  const localSchemasDiverge = hasLocalPair && fromLocalCard.schemaId !== toLocalCard.schemaId
  const mirroredSchemasDiverge = hasMirroredPair && fromMirroredCard.schemaId !== toMirroredCard.schemaId
  const schemasDiverge = localSchemasDiverge || mirroredSchemasDiverge

  const canRenderForm = !loading && !!chosenSchema && splitSchema.steps.length > 0 && !schemasDiverge

  const showSelectPrompt = !loading && !fromOnly && (!hasAnyVersionFrom || !hasAnyVersionTo)

  const flipComparison = () => {
    updateQuery(router, {
      fromEntry: toEntryId,
      fromVersion: toVersion === undefined ? undefined : String(toVersion),
      fromMirroredVersion: toMirroredVersion === undefined ? undefined : String(toMirroredVersion),

      toEntry: fromEntryId,
      toVersion: fromVersion === undefined ? undefined : String(fromVersion),
      toMirroredVersion: fromMirroredVersion === undefined ? undefined : String(fromMirroredVersion),
    })
  }

  return (
    <Container>
      <Paper sx={{ p: 4, my: 4 }}>
        <Stack spacing={4}>
          <Typography variant='h6' component='h1' color='primary'>
            {`Compare ${toTitleCase(kindLabel)} Cards`}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Stack spacing={1} direction='row' sx={{ alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 'bold' }}>From</Typography>
                {renderGotoEntryButton(fromEntry)}
              </Stack>
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
                renderInput={(params) => <TextField {...params} label={kindLabel} />}
              />
              <Autocomplete
                disablePortal
                options={sortedFromLocalRevisions}
                disabled={!fromEntryId}
                loading={isFromRevisionsLoading}
                fullWidth
                size='small'
                value={fromLocalOption}
                getOptionLabel={renderVersionLabel}
                getOptionDisabled={isFromLocalOptionDisabled}
                isOptionEqualToValue={(option, value) => option.version === value.version}
                onChange={(_event, value) => setVersion(QueryDiffSide.From, QueryCardType.Standard, value?.version)}
                renderInput={(params) => <TextField {...params} label='Version' />}
              />
              <RevisionDetails revision={fromLocalOption} />
              {fromHasMirroredRevisions && (
                <>
                  <Autocomplete
                    disablePortal
                    options={sortedFromMirroredRevisions}
                    disabled={!fromEntryId}
                    loading={isFromRevisionsLoading}
                    fullWidth
                    size='small'
                    value={fromMirroredOption}
                    getOptionLabel={renderVersionLabel}
                    getOptionDisabled={isFromLocalOptionDisabled}
                    isOptionEqualToValue={(option, value) => option.version === value.version}
                    onChange={(_event, value) => setVersion(QueryDiffSide.From, QueryCardType.Mirror, value?.version)}
                    renderInput={(params) => <TextField {...params} label='Mirrored Version' />}
                  />
                  <RevisionDetails revision={fromMirroredOption} />
                </>
              )}
            </Stack>
            <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <Typography>&nbsp;</Typography>
              <Tooltip title='Swap comparison sides'>
                <span>
                  <Fab
                    color='primary'
                    aria-label='Swap From and To comparison sides'
                    onClick={flipComparison}
                    disabled={!fromEntryId && !toEntryId}
                  >
                    <CompareArrowsIcon
                      sx={{
                        transition: 'transform 150ms ease-in-out',
                        '&:focus': {
                          transform: 'rotate(180deg)',
                        },
                        '&:hover': {
                          transform: 'rotate(180deg)',
                        },
                      }}
                      fontSize='large'
                    />
                  </Fab>
                </span>
              </Tooltip>
            </Stack>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Stack spacing={1} direction='row' sx={{ alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 'bold' }}>To</Typography>
                {renderGotoEntryButton(toEntry)}
              </Stack>
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
                renderInput={(params) => <TextField {...params} label={kindLabel} />}
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
                getOptionDisabled={isToLocalOptionDisabled}
                isOptionEqualToValue={(option, value) => option.version === value.version}
                onChange={(_event, value) => setVersion(QueryDiffSide.To, QueryCardType.Standard, value?.version)}
                renderInput={(params) => <TextField {...params} label='Version' />}
              />
              <RevisionDetails revision={toLocalOption} />
              {toHasMirroredRevisions && (
                <>
                  <Autocomplete
                    disablePortal
                    options={sortedToMirroredRevisions}
                    disabled={!toEntryId}
                    loading={isToRevisionsLoading}
                    fullWidth
                    size='small'
                    value={toMirroredOption}
                    getOptionLabel={renderVersionLabel}
                    getOptionDisabled={isToMirroredOptionDisabled}
                    isOptionEqualToValue={(option, value) => option.version === value.version}
                    onChange={(_event, value) => setVersion(QueryDiffSide.To, QueryCardType.Mirror, value?.version)}
                    renderInput={(params) => <TextField {...params} label='Mirrored Version' />}
                  />
                  <RevisionDetails revision={toMirroredOption} />
                </>
              )}
            </Stack>
          </Stack>
          {loading && <Loading />}
          {showSelectPrompt && (
            <Alert severity='info'>
              Select a {kindLabel.toLowerCase()} and at least one version on both sides to view a diff.
            </Alert>
          )}
          {!loading && fromOnly && canRenderForm && (
            <Alert severity='info' sx={{ mb: 2 }}>
              Showing a single {kindLabel.toLowerCase()} card. Select a version on the “To” side to compare.
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
              compareMode={!fromOnly}
              mirroredModel={fromOnly ? !!fromMirroredCard : useMirroredLayout}
            />
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
