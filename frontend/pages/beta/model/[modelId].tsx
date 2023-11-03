import { useGetModel } from 'actions/model'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import MessageAlert from 'src/MessageAlert'
import AccessRequests from 'src/model/beta/AccessRequests'
import ModelImages from 'src/model/beta/ModelImages'
import Overview from 'src/model/beta/Overview'
import Releases from 'src/model/beta/Releases'
import Settings from 'src/model/beta/Settings'
import Wrapper from 'src/Wrapper.beta'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)

  function requestAccess() {
    router.push(`/beta/model/${modelId}/access/schema`)
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <Wrapper title={model ? model.name : 'Loading...'} page='marketplace' fullWidth>
      {isModelLoading && <Loading />}
      {model && (
        <PageWithTabs
          title={model.name}
          tabs={[
            { title: 'Overview', path: 'overview', view: <Overview model={model} /> },
            { title: 'Releases', path: 'releases', view: <Releases model={model} /> },
            { title: 'Access Requests', path: 'access', view: <AccessRequests model={model} /> },
            { title: 'Registry', path: 'registry', view: <ModelImages model={model} /> },
            { title: 'Settings', path: 'settings', view: <Settings model={model} /> },
          ]}
          displayActionButton
          actionButtonTitle='Request access'
          actionButtonOnClick={requestAccess}
          requiredUrlParams={{ modelId: model.id }}
        />
      )}
    </Wrapper>
  )
}
