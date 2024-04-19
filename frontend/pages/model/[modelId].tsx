import { useGetModel } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import AccessRequests from 'src/entry/model/AccessRequests'
import InferenceServices from 'src/entry/model/InferenceServices'
import ModelImages from 'src/entry/model/ModelImages'
import Releases from 'src/entry/model/Releases'
import Settings from 'src/entry/model/Settings'
import Overview from 'src/entry/overview/Overview'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const tabs = useMemo(
    () =>
      model && uiConfig
        ? [
            { title: 'Overview', path: 'overview', view: <Overview entry={model} /> },
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
    <>
      <Title text={model ? model.name : 'Loading...'} />
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
          textToCopy={model.id}
        />
      )}
    </>
  )
}
