import { useGetModel } from 'actions/model'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import AccessRequests from 'src/model/AccessRequests'
import ModelImages from 'src/model/ModelImages'
import Overview from 'src/model/Overview'
import Releases from 'src/model/Releases'
import Settings from 'src/model/Settings'
import Wrapper from 'src/Wrapper'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const roles = useMemo(
    () => model?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles,
    [model, currentUser],
  )

  const tabs = useMemo(
    () =>
      model && roles
        ? [
            { title: 'Overview', path: 'overview', view: <Overview model={model} /> },
            {
              title: 'Releases',
              path: 'releases',
              view: <Releases model={model} roles={roles} />,
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Access Requests',
              path: 'access',
              view: <AccessRequests model={model} roles={roles} />,
              datatest: 'accessRequestTab',
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Registry',
              path: 'registry',
              view: <ModelImages model={model} />,
            },
            { title: 'Settings', path: 'settings', view: <Settings model={model} /> },
          ]
        : [],
    [model, roles],
  )

  function requestAccess() {
    router.push(`/model/${modelId}/access-request/schema`)
  }

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isModelError,
    isCurrentUserError,
  })
  if (error) return error

  return (
    <Wrapper title={model ? model.name : 'Loading...'} page='marketplace' fullWidth>
      {isModelLoading && isCurrentUserLoading && <Loading />}
      {model && (
        <PageWithTabs
          title={model.name}
          tabs={tabs}
          displayActionButton={model.card !== undefined}
          actionButtonTitle='Request access'
          actionButtonOnClick={requestAccess}
          requiredUrlParams={{ modelId: model.id }}
          showCopyButton
          textToCopy={model.id}
        />
      )}
    </Wrapper>
  )
}
