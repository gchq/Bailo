import { useGetModel } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useContext, useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs, { PageTab } from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import AccessRequests from 'src/entry/model/AccessRequests'
import InferenceServices from 'src/entry/model/InferenceServices'
import ModelImages from 'src/entry/model/ModelImages'
import Releases from 'src/entry/model/Releases'
import Overview from 'src/entry/overview/Overview'
import Settings from 'src/entry/settings/Settings'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryKind } from 'types/types'
import { getCurrentUserRoles } from 'utils/roles'

export default function Model() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId, EntryKind.MODEL)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const { userPermissions } = useContext(UserPermissionsContext)

  const currentUserRoles = useMemo(() => getCurrentUserRoles(model, currentUser), [model, currentUser])

  const settingsPermission = useMemo(() => userPermissions['editEntry'], [userPermissions])

  const tabs: PageTab[] = useMemo(
    () =>
      model && uiConfig
        ? [
            {
              title: 'Overview',
              path: 'overview',
              view: <Overview entry={model} readOnly={!!model.settings.mirror?.sourceModelId} />,
            },
            {
              title: 'Releases',
              path: 'releases',
              view: (
                <Releases
                  model={model}
                  currentUserRoles={currentUserRoles}
                  readOnly={!!model.settings.mirror?.sourceModelId}
                />
              ),
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Access Requests',
              path: 'access',
              view: <AccessRequests model={model} currentUserRoles={currentUserRoles} />,
              datatest: 'accessRequestTab',
              disabled: !model.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Registry',
              path: 'registry',
              view: <ModelImages model={model} readOnly={!!model.settings.mirror?.sourceModelId} />,
            },
            {
              title: 'Inferencing',
              path: 'inferencing',
              view: <InferenceServices model={model} />,
              hidden: !uiConfig.inference.enabled,
            },
            {
              title: 'Settings',
              path: 'settings',
              disabled: !settingsPermission.hasPermission,
              disabledText: settingsPermission.info,
              view: <Settings entry={model} />,
            },
          ]
        : [],
    [model, uiConfig, currentUserRoles, settingsPermission.hasPermission, settingsPermission.info],
  )

  function requestAccess() {
    router.push(`/model/${modelId}/access-request/schema`)
  }

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isModelError,
    isCurrentUserError,
    isUiConfigError,
  })
  if (error) return error

  return (
    <>
      <Title text={model ? model.name : 'Loading...'} />
      {!model || isModelLoading || isCurrentUserLoading || isUiConfigLoading ? (
        <Loading />
      ) : (
        model && (
          <PageWithTabs
            title={model.name}
            subheading={`ID: ${model.id}`}
            additionalInfo={model.description}
            tabs={tabs}
            displayActionButton={model.card !== undefined}
            actionButtonTitle='Request access'
            actionButtonOnClick={requestAccess}
            requiredUrlParams={{ modelId: model.id }}
            titleToCopy={model.name}
            subheadingToCopy={model.id}
            sourceModelId={model.settings.mirror?.sourceModelId}
          />
        )
      )}
    </>
  )
}
