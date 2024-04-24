import { useGetModel } from 'actions/model'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MessageAlert from 'src/MessageAlert'
import SchemaSelect from 'src/schemas/SchemaSelect'

export default function DataCardSchema() {
  const router = useRouter()
  const { dataCardId }: { dataCardId?: string } = router.query

  const { model: dataCard, isModelLoading: isDataCardLoading, isModelError: isDataCardError } = useGetModel(dataCardId)

  if (isDataCardError) {
    return (
      <>
        <Title text='Error' />
        <MessageAlert message={isDataCardError.info.message} severity='error' />
      </>
    )
  }

  return (
    <>
      <Title text='Select a schema' />
      {isDataCardLoading && <Loading />}
      {dataCard && <SchemaSelect entry={dataCard} />}
    </>
  )
}
