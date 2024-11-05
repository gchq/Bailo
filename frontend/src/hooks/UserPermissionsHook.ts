import { useGetCurrentUserPermissionsForAccessRequest } from 'actions/accessRequest'
import { useGetCurrentUserPermissionsForEntry } from 'actions/model'
import { useMemo } from 'react'
import { AccessRequestUserPermissions, EntryUserPermissions, PermissionDetail, UserPermissions } from 'types/types'

export type UserPermissionsHook = {
  userPermissions: UserPermissions
}

const defaultPermissionDetail: PermissionDetail = {
  hasPermission: false,
  info: 'Permission not set.',
}

const defaultAccessRequestPermissions: AccessRequestUserPermissions = {
  editAccessRequest: defaultPermissionDetail,
  deleteAccessRequest: defaultPermissionDetail,
}

const defaultEntryPermissions: EntryUserPermissions = {
  editEntry: defaultPermissionDetail,
  editEntryCard: defaultPermissionDetail,
  createRelease: defaultPermissionDetail,
  editRelease: defaultPermissionDetail,
  deleteRelease: defaultPermissionDetail,
  pushModelImage: defaultPermissionDetail,
  createInferenceService: defaultPermissionDetail,
  editInferenceService: defaultPermissionDetail,
  exportMirroredModel: defaultPermissionDetail,
}

export const defaultUserPermissions = { ...defaultEntryPermissions, ...defaultAccessRequestPermissions }

export default function useUserPermissions(entryId?: string, accessRequestId?: string): UserPermissionsHook {
  const { entryUserPermissions } = useGetCurrentUserPermissionsForEntry(entryId)
  const { accessRequestUserPermissions } = useGetCurrentUserPermissionsForAccessRequest(entryId, accessRequestId)

  const userPermissions = useMemo(
    () => ({
      ...(entryUserPermissions ? entryUserPermissions : defaultEntryPermissions),
      ...(accessRequestUserPermissions ? accessRequestUserPermissions : defaultAccessRequestPermissions),
    }),
    [accessRequestUserPermissions, entryUserPermissions],
  )

  return {
    userPermissions,
  }
}
