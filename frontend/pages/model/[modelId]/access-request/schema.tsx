import { useGetEntry } from 'actions/entry'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import SchemaSelect from 'src/schemas/SchemaSelect'
import { EntryKind, SchemaKind } from 'types/types'

export default function AccessRequestSchema() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const {
    entry: model,
    isEntryLoading: isModelLoading,
    isEntryError: isModelError,
  } = useGetEntry(modelId, EntryKind.MODEL)

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isModelError,
  })

  if (error) {
    return error
  }

  return (
    <>
      <Title text='Select a schema' />
      {isModelLoading && <Loading />}
      {model && <SchemaSelect schemaKind={SchemaKind.ACCESS_REQUEST} entry={model} />}
    </>
  )
}
