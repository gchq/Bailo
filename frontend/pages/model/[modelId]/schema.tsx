import { useGetModel } from 'actions/model'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import SchemaSelect from 'src/schemas/SchemaSelect'

export default function ModelSchema() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  if (isModelError) {
    return <ErrorWrapper message={isModelError.info.message} />
  }

  return (
    <>
      <Title text='Select a schema' />
      {isModelLoading && <Loading />}
      {model && <SchemaSelect entry={model} />}
    </>
  )
}
