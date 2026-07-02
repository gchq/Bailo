import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { Button, Container, Paper } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetEntryCard } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import { EntryKindKeys, EntryKindLabel, SplitSchemaNoRender } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getStepsFromSchema } from 'utils/formUtils'

type EntryCardHistoryProps = {
  entryId: string
  entryCardVersion: number
  entryKind: EntryKindKeys
  compareWithVersion?: number
  mirrored?: boolean
}

export default function EntryCardHistory({
  entryId,
  entryCardVersion,
  entryKind,
  compareWithVersion,
  mirrored = false,
}: EntryCardHistoryProps) {
  const router = useRouter()
  const theme = useTheme()

  const { entryCard, isEntryCardLoading, isEntryCardError } = useGetEntryCard(entryId, entryCardVersion, mirrored)
  const {
    entryCard: compareEntryCard,
    isEntryCardLoading: isCompareEntryCardLoading,
    isEntryCardError: isCompareEntryCardError,
  } = useGetEntryCard(entryId, compareWithVersion, mirrored)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entryCard?.schemaId || '')

  const initialSplitSchema = useMemo<SplitSchemaNoRender>(() => {
    if (!schema || !entryCard) {
      return { reference: schema?.id || '', steps: [] }
    }
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], entryCard.metadata)
    for (const step of steps) {
      step.steps = steps
    }
    return { reference: schema.id, steps }
  }, [schema, entryCard])

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>(initialSplitSchema)

  const [lastReference, setLastReference] = useState<string | undefined>(undefined)
  if (initialSplitSchema.reference && initialSplitSchema.reference !== lastReference) {
    setLastReference(initialSplitSchema.reference)
    setSplitSchema(initialSplitSchema)
  }

  const error = MultipleErrorWrapper(`Unable to load history page`, {
    isEntryCardError,
    isCompareEntryCardError,
    isSchemaError,
  })
  if (error) {
    return error
  }

  if (isEntryCardLoading || isSchemaLoading || (compareWithVersion !== undefined && isCompareEntryCardLoading)) {
    return <Loading />
  }

  if (!entryCard || !schema) {
    return null
  }

  const showDiff = compareWithVersion !== undefined && !!compareEntryCard?.metadata

  return (
    <Container>
      <Paper sx={{ p: 4, my: 4 }}>
        <Button startIcon={<ArrowBackIosIcon />} onClick={() => router.push(`/${entryKind}/${entryId}`)}>
          {`Back to ${EntryKindLabel[entryKind]}`}
        </Button>
        {showDiff ? (
          <ReactDiffViewer
            oldValue={JSON.stringify(compareEntryCard!.metadata, null, 2)}
            newValue={JSON.stringify(entryCard.metadata, null, 2)}
            splitView
            leftTitle={`Updated by ${compareEntryCard!.createdBy} on ${formatDateString(compareEntryCard!.createdAt)}`}
            rightTitle={`Updated by ${entryCard.createdBy} on ${formatDateString(entryCard.createdAt)}`}
            styles={{
              gutter: {
                pre: {
                  opacity: 1,
                },
              },
              titleBlock: {
                height: 40,
                background: theme.palette.action.hover,
                padding: '8px 12px',
                fontWeight: 'bold',
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
            }}
          />
        ) : (
          <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
        )}
      </Paper>
    </Container>
  )
}
