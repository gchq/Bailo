import { useGetModel } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import AccessRequests from 'src/model/AccessRequests'
import InferenceServices from 'src/model/InferenceServices'
import ModelImages from 'src/model/ModelImages'
import Overview from 'src/model/Overview'
import Releases from 'src/model/Releases'
import Settings from 'src/model/Settings'
import Wrapper from 'src/Wrapper'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const tabs = useMemo(
    () =>
      model && uiConfig
        ? [
            { title: 'Overview', path: 'overview', view: <Overview model={model} /> },
            {
              title: 'Releases',
              path: 'releases',
              view: <Releases model={model} />,
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Access Requests',
              path: 'access',
              view: <AccessRequests model={model} />,
              datatest: 'accessRequestTab',
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Registry',
              path: 'registry',
              view: <ModelImages model={model} />,
            },
            {
              title: 'Inferencing',
              path: 'inferencing',
              view: <InferenceServices model={model} />,
              hidden: !uiConfig.inference.enabled,
            },
            { title: 'Settings', path: 'settings', view: <Settings model={model} /> },
          ]
        : [],
    [model, uiConfig],
  )

  function requestAccess() {
    router.push(`/model/${modelId}/access-request/schema`)
  }

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isModelError,
    isUiConfigError,
  })
  if (error) return error

  return (
    <Wrapper title={model ? model.name : 'Loading...'} page='marketplace' fullWidth>
      {(isModelLoading || isUiConfigLoading) && <Loading />}
      {model && (
        <PageWithTabs
          title={model.name}
          tabs={tabs}
          displayActionButton={model.card !== undefined}
          actionButtonTitle='Request access'
          actionButtonOnClick={requestAccess}
          requiredUrlParams={{ modelId: model.id }}
          showCopyButton
        />
      )}
    </Wrapper>
  )
}
