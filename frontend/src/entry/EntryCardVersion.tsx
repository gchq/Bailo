import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Paper, Stack, Typography } from '@mui/material'
import { useGetEntry } from 'actions/entry'
import { useGetEntryCard } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import Link from 'src/Link'
import { EntryKind, type EntryKindKeys, EntryKindLabel, MODEL_ENTRY_KINDS, type SplitSchemaNoRender } from 'types/types'
import { getStepsFromSchema } from 'utils/formUtils'
import { entryCardPath, entryKindForRedirect } from 'utils/routerUtils'

type EntryCardVersionProps = {
  entryKind: EntryKindKeys
  entryId?: string
  version?: number
  mirroredVersion?: number
}

export function buildCompareWithCurrentHref(
  entryId: string,
  entryKind: EntryKindKeys,
  version?: number,
  mirroredVersion?: number,
): string {
  // The compare page defaults an empty "To" version to the latest one
  const query = new URLSearchParams({ fromEntry: entryId, toEntry: entryId })
  if (version !== undefined) {
    query.set('fromVersion', String(version))
  }
  if (mirroredVersion !== undefined) {
    query.set('fromMirroredVersion', String(mirroredVersion))
  }
  return `${entryCardPath(entryKind)}/compare?${query.toString()}`
}

export default function EntryCardVersion({ entryKind, entryId, version, mirroredVersion }: EntryCardVersionProps) {
  const { entry, isEntryLoading, isEntryError } = useGetEntry(
    entryId,
    entryKind === EntryKind.MODEL ? MODEL_ENTRY_KINDS : entryKind,
  )
  const {
    entryCard: localCard,
    isEntryCardLoading: isLocalLoading,
    isEntryCardError: isLocalError,
  } = useGetEntryCard(entryId, version, false)
  const {
    entryCard: mirroredCard,
    isEntryCardLoading: isMirroredLoading,
    isEntryCardError: isMirroredError,
  } = useGetEntryCard(entryId, mirroredVersion, true)

  const schemaId = (localCard ?? mirroredCard)?.schemaId
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId ?? '')

  const initialSplit = useMemo<SplitSchemaNoRender>(() => {
    if (!schema) {
      return { reference: '', steps: [] }
    }
    const steps = getStepsFromSchema(
      schema,
      {},
      ['properties.contacts'],
      localCard?.metadata ?? {},
      mirroredCard?.metadata ?? {},
    )
    for (const step of steps) {
      step.steps = steps
    }
    return { reference: schema.id, steps }
  }, [schema, localCard?.metadata, mirroredCard?.metadata])

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>(initialSplit)

  useEffect(() => {
    setSplitSchema(initialSplit)
  }, [initialSplit])

  const error = MultipleErrorWrapper(`Unable to load ${EntryKindLabel[entryKind]} card version`, {
    isEntryError,
    isLocalError,
    isMirroredError,
    isSchemaError,
  })
  if (error) {
    return error
  }

  const loading = isEntryLoading || isLocalLoading || isMirroredLoading || (!!schemaId && isSchemaLoading)

  const versionLabel = [
    version !== undefined ? `v${version}` : undefined,
    mirroredVersion !== undefined ? `Mirrored v${mirroredVersion}` : undefined,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Container>
      <Paper sx={{ p: 4, my: 4 }}>
        <Stack spacing={4}>
          {entry && (
            <Link href={`/${entryKindForRedirect(entry.kind)}/${entry.id}`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                {`Back to ${EntryKindLabel[entry.kind]}`}
              </Button>
            </Link>
          )}
          <Stack direction='row' spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='h6' component='h1' color='primary'>
              {`${entry?.name ?? ''} ${versionLabel}`}
            </Typography>
            {entryId && (
              <Link
                sx={{ fontWeight: 'bold' }}
                href={buildCompareWithCurrentHref(entryId, entryKind, version, mirroredVersion)}
              >
                Compare with latest version
              </Link>
            )}
          </Stack>
          {loading && <Loading />}
          {!loading && schema && splitSchema.steps.length > 0 && (
            <JsonSchemaForm
              splitSchema={splitSchema}
              setSplitSchema={setSplitSchema}
              canEdit={false}
              mirroredModel={!!mirroredCard}
            />
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
