import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import {
  Alert,
  Autocomplete,
  Container,
  IconButton,
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { EntrySearchResult, useGetEntry, useListEntries } from 'actions/entry'
import { useGetEntryCard, useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Loading from 'src/common/Loading'
import EntryCardSnapshotSelector, {
  buildSnapshots,
  EntryCardSnapshot,
} from 'src/entry/overview/EntryCardSnapshotSelector'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import useDebounce from 'src/hooks/useDebounce'
import { EntryKind, EntryKindKeys, EntryKindLabel, MODEL_ENTRY_KINDS, SplitSchemaNoRender } from 'types/types'
import { getStepsFromSchema } from 'utils/formUtils'
import { entryKindForRedirect, updateQuery } from 'utils/routerUtils'
import { toTitleCase } from 'utils/stringUtils'

const QueryDiffSide = {
  To: 'to',
  From: 'from',
} as const

type QueryDiffSide = (typeof QueryDiffSide)[keyof typeof QueryDiffSide]

type EntryCardCompareProps = {
  entryKind: EntryKindKeys
  fromEntryId?: string
  fromVersion?: number
  fromMirroredVersion?: number
  toEntryId?: string
  toVersion?: number
  toMirroredVersion?: number
}

type EntryOption = Pick<EntrySearchResult, 'id' | 'name' | 'kind'>

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

  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [fromSearch, setFromSearch] = useState('')
  const [toSearch, setToSearch] = useState('')
  const debouncedFromSearch = useDebounce(fromSearch, 250)
  const debouncedToSearch = useDebounce(toSearch, 250)

  const searchKinds = entryKind === EntryKind.MODEL ? MODEL_ENTRY_KINDS : entryKind
  const { entry: fromEntry } = useGetEntry(fromEntryId, searchKinds)
  const { entry: toEntry } = useGetEntry(toEntryId, searchKinds)

  const { entries: fromEntriesRaw, isEntriesLoading: isFromEntriesLoading } = useListEntries(
    searchKinds,
    [],
    '',
    [],
    [],
    [],
    [],
    debouncedFromSearch,
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
    debouncedToSearch,
    undefined,
    undefined,
    true,
  )

  const fromEntries: EntryOption[] =
    fromEntry && !fromEntriesRaw.some((entry) => entry.id === fromEntry.id)
      ? [fromEntry, ...fromEntriesRaw]
      : fromEntriesRaw
  const toEntries: EntryOption[] =
    toEntry && !toEntriesRaw.some((entry) => entry.id === toEntry.id) ? [toEntry, ...toEntriesRaw] : toEntriesRaw

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

  const fromSnapshots = useMemo(() => buildSnapshots(fromRevisions), [fromRevisions])
  const toSnapshots = useMemo(() => buildSnapshots(toRevisions), [toRevisions])

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

  const setModel = (side: QueryDiffSide, model: EntryOption | null) => {
    if (side === QueryDiffSide.From) {
      setFromInput(model ? `${model.name} (${model.id})` : '')
      setFromSearch('')
      updateQuery(router, { fromEntry: model?.id, fromVersion: undefined, fromMirroredVersion: undefined })
    } else {
      setToInput(model ? `${model.name} (${model.id})` : '')
      setToSearch('')
      updateQuery(router, { toEntry: model?.id, toVersion: undefined, toMirroredVersion: undefined })
    }
  }

  const setSnapshot = useCallback(
    (side: QueryDiffSide, snapshot: EntryCardSnapshot) => {
      updateQuery(router, {
        [`${side}Version`]: snapshot.local === undefined ? undefined : String(snapshot.local),
        [`${side}MirroredVersion`]: snapshot.mirrored === undefined ? undefined : String(snapshot.mirrored),
      })
    },
    [router],
  )

  const defaultedFromEntryId = useRef<string | undefined>(undefined)
  const defaultedToEntryId = useRef<string | undefined>(undefined)

  useEffect(() => {
    setFromInput(fromEntry ? `${fromEntry.name} (${fromEntry.id})` : '')
    setFromSearch('')
  }, [fromEntry, fromEntryId])

  useEffect(() => {
    setToInput(toEntry ? `${toEntry.name} (${toEntry.id})` : '')
    setToSearch('')
  }, [toEntry, toEntryId])

  useEffect(() => {
    if (fromVersion !== undefined || fromMirroredVersion !== undefined) {
      defaultedFromEntryId.current = undefined
      return
    }
    const latestSnapshot = fromSnapshots.at(-1)
    if (fromEntryId && latestSnapshot && !isFromRevisionsLoading && defaultedFromEntryId.current !== fromEntryId) {
      defaultedFromEntryId.current = fromEntryId
      setSnapshot(QueryDiffSide.From, latestSnapshot)
    }
  }, [fromEntryId, fromMirroredVersion, fromSnapshots, fromVersion, isFromRevisionsLoading, setSnapshot])

  useEffect(() => {
    if (toVersion !== undefined || toMirroredVersion !== undefined) {
      defaultedToEntryId.current = undefined
      return
    }
    const latestSnapshot = toSnapshots.at(-1)
    if (toEntryId && latestSnapshot && !isToRevisionsLoading && defaultedToEntryId.current !== toEntryId) {
      defaultedToEntryId.current = toEntryId
      setSnapshot(QueryDiffSide.To, latestSnapshot)
    }
  }, [isToRevisionsLoading, setSnapshot, toEntryId, toMirroredVersion, toSnapshots, toVersion])

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

  const renderEntryLabel = (entry: EntryOption) => `${entry.name} (${entry.id})`

  const snapshotMatchesVersions = (snapshot: EntryCardSnapshot, localVersion?: number, mirroredVersion?: number) =>
    snapshot.local === localVersion && snapshot.mirrored === mirroredVersion

  const fromSnapshot = fromSnapshots.find((snapshot) =>
    snapshotMatchesVersions(snapshot, fromVersion, fromMirroredVersion),
  )
  const toSnapshot = toSnapshots.find((snapshot) => snapshotMatchesVersions(snapshot, toVersion, toMirroredVersion))
  const sameEntrySelected = !!fromEntryId && fromEntryId === toEntryId

  const kindLabel = EntryKindLabel[entryKind]

  const renderGotoEntryButton = (entry?: EntryOption) => {
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
                inputValue={fromInput}
                getOptionLabel={renderEntryLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input') {
                    setFromInput(value)
                    setFromSearch(value)
                  }
                }}
                onChange={(_event, value) => setModel(QueryDiffSide.From, value)}
                renderInput={(params) => <TextField {...params} label={kindLabel} />}
              />
              <EntryCardSnapshotSelector
                snapshots={fromSnapshots}
                selected={fromSnapshot}
                disabled={!fromEntryId || isFromRevisionsLoading}
                isSnapshotDisabled={(snapshot) =>
                  sameEntrySelected &&
                  !!toSnapshot &&
                  snapshotMatchesVersions(snapshot, toSnapshot.local, toSnapshot.mirrored)
                }
                onSelect={(snapshot) => setSnapshot(QueryDiffSide.From, snapshot)}
              />
            </Stack>
            <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <Typography>&nbsp;</Typography>
              <Tooltip title='Swap comparison sides'>
                <span>
                  <IconButton
                    color='primary'
                    aria-label='Swap From and To comparison sides'
                    onClick={flipComparison}
                    disabled={!fromEntryId && !toEntryId}
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      '&.Mui-disabled': {
                        borderColor: 'action.disabled',
                      },
                    }}
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
                  </IconButton>
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
                inputValue={toInput}
                getOptionLabel={renderEntryLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input') {
                    setToInput(value)
                    setToSearch(value)
                  }
                }}
                onChange={(_event, value) => setModel(QueryDiffSide.To, value)}
                renderInput={(params) => <TextField {...params} label={kindLabel} />}
              />
              <EntryCardSnapshotSelector
                snapshots={toSnapshots}
                selected={toSnapshot}
                disabled={!toEntryId || isToRevisionsLoading}
                isSnapshotDisabled={(snapshot) =>
                  sameEntrySelected &&
                  !!fromSnapshot &&
                  snapshotMatchesVersions(snapshot, fromSnapshot.local, fromSnapshot.mirrored)
                }
                onSelect={(snapshot) => setSnapshot(QueryDiffSide.To, snapshot)}
              />
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
