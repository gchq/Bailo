import { useGetEntry } from 'actions/entry'
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
import ModelFileManagement from 'src/entry/model/ModelFileManagement'
import ModelImages from 'src/entry/model/ModelImages'
import Releases from 'src/entry/model/Releases'
import Overview from 'src/entry/Overview'
import Settings from 'src/entry/settings/Settings'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import MessageAlert from 'src/MessageAlert'
import { EntryKind } from 'types/types'
import { getCurrentUserRoles } from 'utils/roles'

export default function Model() {
  const router = useRouter()
  const { modelId: entryId }: { modelId?: string } = router.query
  const { entry, isEntryLoading, isEntryError, mutateEntry } = useGetEntry(entryId)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const { userPermissions } = useContext(UserPermissionsContext)

  const currentUserRoles = useMemo(() => getCurrentUserRoles(entry, currentUser), [entry, currentUser])

  const settingsPermission = useMemo(() => userPermissions['editEntry'], [userPermissions])

  const tabs: PageTab[] = useMemo(
    () =>
      entry && uiConfig
        ? [
            {
              title: 'Overview',
              path: 'overview',
              view: <Overview entry={entry} mutateEntry={mutateEntry} />,
            },
            {
              title: 'Releases',
              path: 'releases',
              view: (
                <Releases
                  model={entry}
                  currentUserRoles={currentUserRoles}
                  readOnly={entry.kind === EntryKind.MIRRORED_MODEL}
                />
              ),
              disabled: !entry.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Access requests',
              path: 'access',
              view: <AccessRequests model={entry} currentUserRoles={currentUserRoles} />,
              datatest: 'accessRequestTab',
              disabled: !entry.card,
              disabledText: 'Select a schema to view this tab',
            },
            {
              title: 'Registry',
              path: 'registry',
              view: <ModelImages model={entry} readOnly={entry.kind === EntryKind.MIRRORED_MODEL} />,
            },
            {
              title: 'File management',
              path: 'files',
              view: <ModelFileManagement model={entry} />,
            },
            {
              title: 'Inferencing',
              path: 'inferencing',
              view: <InferenceServices model={entry} />,
              hidden: !uiConfig.inference.enabled,
            },
            {
              title: 'Settings',
              path: 'settings',
              disabled: !settingsPermission.hasPermission,
              disabledText: settingsPermission.info,
              view: <Settings entry={entry} />,
            },
          ]
        : [],
    [entry, uiConfig, currentUserRoles, settingsPermission.hasPermission, settingsPermission.info, mutateEntry],
  )

  function requestAccess() {
    router.push(`/model/${entryId}/access-request/schema`)
  }

  const error = MultipleErrorWrapper(`Unable to load model page`, {
    isEntryError,
    isCurrentUserError,
    isUiConfigError,
  })
  if (error) {
    return error
  }

  return (
    <>
      <Title text={entry ? entry.name : 'Loading...'} />
      {!entry || isEntryLoading || isCurrentUserLoading || isUiConfigLoading ? (
        <Loading />
      ) : (
        <PageWithTabs
          title={entry.name}
          subheading={`ID: ${entry.id}`}
          additionalInfo={entry.description}
          tabs={tabs}
          displayActionButton={entry.card !== undefined}
          actionButtonTitle='Request access'
          actionButtonOnClick={requestAccess}
          requiredUrlParams={{ modelId: entry.id }}
          titleToCopy={entry.name}
          subheadingToCopy={entry.id}
          additionalHeaderDisplay={
            entry.kind === EntryKind.MIRRORED_MODEL ? (
              <MessageAlert
                message={`This is a mirrored model, some sections will be read-only.`}
                subHeading={`Source model ID: ${entry.settings.mirror?.sourceModelId}`}
                severity='info'
              />
            ) : (
              <></>
            )
          }
        />
      )}
    </>
  )
}
