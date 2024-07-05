import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import SchemaSelect from 'src/schemas/SchemaSelect'
import { SchemaKind } from 'types/types'

export default function AccessRequestSchema() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query

  return (
    <>
      <Title text='Select a schema' />
      {<SchemaSelect schemaKind={SchemaKind.ACCESS_REQUEST} id={modelId} />}
    </>
  )
}
