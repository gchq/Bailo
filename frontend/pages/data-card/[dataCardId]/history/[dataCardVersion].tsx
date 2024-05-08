import { useGetEntryCard } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EntryCardVersion from 'src/entry/EntryCardVersion'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryKind } from 'types/types'

export default function DataCardVersion() {
  const router = useRouter()
  const { dataCardId, dataCardVersion }: { dataCardId?: string; dataCardVersion?: number } = router.query

  const { entryCard, isEntryCardLoading, isEntryCardError } = useGetEntryCard(dataCardId, dataCardVersion)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entryCard?.schemaId || '')

  const error = MultipleErrorWrapper(`Unable to load history page`, {
    isEntryCardError,
    isSchemaError,
  })
  if (error) return error

  return (
    <>
      <Title text='Data Card Revision' />
      {(isEntryCardLoading || isSchemaLoading) && <Loading />}
      {entryCard && schema && dataCardId && (
        <EntryCardVersion entryCard={entryCard} schema={schema} entryId={dataCardId} entryKind={EntryKind.DATA_CARD} />
      )}
    </>
  )
}
