import { useGetModel } from 'actions/model'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import SchemaSelect from 'src/schemas/SchemaSelect'
import { EntryKind } from 'types/types'

export default function DataCardSchema() {
  const router = useRouter()
  const { dataCardId }: { dataCardId?: string } = router.query

  const {
    model: dataCard,
    isModelLoading: isDataCardLoading,
    isModelError: isDataCardError,
  } = useGetModel(dataCardId, EntryKind.DATA_CARD)

  if (isDataCardError) {
    return <ErrorWrapper message={isDataCardError.info.message} />
  }

  return (
    <>
      <Title text='Select a schema' />
      {isDataCardLoading && <Loading />}
      {dataCard && <SchemaSelect entry={dataCard} />}
    </>
  )
}
