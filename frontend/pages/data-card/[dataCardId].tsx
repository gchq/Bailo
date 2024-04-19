import { useGetModel } from 'actions/model'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import Overview from 'src/entry/overview/Overview'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Wrapper from 'src/Wrapper'

export default function DataCard() {
  const router = useRouter()
  const { dataCardId }: { dataCardId?: string } = router.query
  const { model: dataCard, isModelLoading: isDataCardLoading, isModelError: isDataCardError } = useGetModel(dataCardId)

  const tabs = useMemo(
    () => (dataCard ? [{ title: 'Overview', path: 'overview', view: <Overview entry={dataCard} /> }] : []),
    [dataCard],
  )

  const error = MultipleErrorWrapper(`Unable to load data card page`, {
    isDataCardError,
  })
  if (error) return error

  return (
    <Wrapper title={dataCard ? dataCard.name : 'Loading...'} page='data-card' fullWidth>
      {isDataCardLoading && <Loading />}
      {dataCard && (
        <PageWithTabs
          showCopyButton
          title={dataCard.name}
          tabs={tabs}
          requiredUrlParams={{ dataCardId: dataCard.id }}
          textToCopy={dataCard.id}
        />
      )}
    </Wrapper>
  )
}
