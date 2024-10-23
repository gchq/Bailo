import { useGetCurrentUserPermissionsForEntry } from 'actions/model'
import { useEffect, useState } from 'react'
import { PermissionDetail, UserPermissions } from 'types/types'

export type UserPermissionsHook = {
  userPermissions: UserPermissions
  setEntryId: (entryId: string) => void
}

const defaultPermissionDetail: PermissionDetail = {
  hasPermission: false,
  info: 'Permission not set.',
}
export const defaultPermissions: UserPermissions = {
  editEntry: defaultPermissionDetail,
  editEntryCard: defaultPermissionDetail,
  editAccessRequest: defaultPermissionDetail,
  deleteAccessRequest: defaultPermissionDetail,
  reviewAccessRequest: defaultPermissionDetail,
  createRelease: defaultPermissionDetail,
  editRelease: defaultPermissionDetail,
  deleteRelease: defaultPermissionDetail,
  reviewRelease: defaultPermissionDetail,
  pushModelImage: defaultPermissionDetail,
  createInferenceService: defaultPermissionDetail,
  editInferenceService: defaultPermissionDetail,
  exportMirroredModel: defaultPermissionDetail,
}

export default function useUserPermissions(): UserPermissionsHook {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>(defaultPermissions)
  const [entryId, setEntryId] = useState('')

  const {
    userPermissions: permissions,
    isUserPermissionsLoading,
    isUserPermissionsError,
  } = useGetCurrentUserPermissionsForEntry(entryId)

  useEffect(() => {
    if (permissions && !isUserPermissionsLoading && !isUserPermissionsError) {
      setUserPermissions(permissions)
    }
  }, [isUserPermissionsError, isUserPermissionsLoading, permissions])
  return {
    userPermissions,
    setEntryId,
  }
}
