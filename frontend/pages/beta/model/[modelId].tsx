import { useRouter } from 'next/router'

import { useGetModel } from '../../../actions/model'
import EmptyBlob from '../../../src/common/EmptyBlob'
import Loading from '../../../src/common/Loading'
import PageWithTabs from '../../../src/common/PageWithTabs'
import Overview from '../../../src/model/beta/Overview'
import Releases from '../../../src/model/beta/Releases'
import Settings from '../../../src/model/beta/Settings'
import Wrapper from '../../../src/Wrapper.beta'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  function requestAccess() {
    router.push(`/beta/model/${modelId}/access/schema`)
  }

  return (
    <Wrapper title={model ? model.name : 'Loading...'} page='marketplace' fullWidth>
      {isModelLoading && <Loading />}
      {!model && !isModelLoading && <EmptyBlob text={`Oh no, it looks like model ${modelId} doesn't exist!`} />}
      {model && !isModelLoading && !isModelError && (
        <PageWithTabs
          title={`Example Team / ${model.name}`}
          tabs={[
            { title: 'Overview', view: <Overview model={model} /> },
            { title: 'Code', view: <Settings model={model} /> },
            { title: 'Releases', view: <Releases model={model} /> },
            { title: 'Compliance', view: <Settings model={model} /> },
            { title: 'Access Requests', view: <Settings model={model} /> },
            { title: 'Settings', view: <Settings model={model} /> },
          ]}
          displayActionButton
          actionButtonTitle='Request access'
          actionButtonOnClick={requestAccess}
        />
      )}
    </Wrapper>
  )
}
