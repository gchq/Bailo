import { useGetModel } from 'actions/model'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MessageAlert from 'src/MessageAlert'
import SchemaSelect from 'src/schemas/SchemaSelect'

export default function ModelSchema() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  if (isModelError) {
    return (
      <>
        <Title text='Error' />
        <MessageAlert message={isModelError.info.message} severity='error' />
      </>
    )
  }

  return (
    <>
      <Title text='Select a schema' />
      {isModelLoading && <Loading />}
      {model && <SchemaSelect entry={model} />}
    </>
  )
}
