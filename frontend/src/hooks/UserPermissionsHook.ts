import { useGetCurrentUserPermissionsForAccessRequest } from 'actions/accessRequest'
import { useGetCurrentUserPermissionsForEntry } from 'actions/model'
import { useMemo, useState } from 'react'
import { AccessRequestUserPermissions, EntryUserPermissions, PermissionDetail, UserPermissions } from 'types/types'

export type UserPermissionsHook = {
  userPermissions: UserPermissions
  setEntryId: (entryId?: string) => void
  setAccessRequestId: (accessRequestId?: string) => void
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

export default function useUserPermissions(): UserPermissionsHook {
  const [entryId, setEntryId] = useState<string | undefined>(undefined)
  const [accessRequestId, setAccessRequestId] = useState<string | undefined>(undefined)

  const { accessRequestUserPermissions } = useGetCurrentUserPermissionsForAccessRequest(entryId, accessRequestId)

  const { entryUserPermissions } = useGetCurrentUserPermissionsForEntry(entryId)

  const userPermissions = useMemo(
    () => ({
      ...(entryUserPermissions ? entryUserPermissions : defaultEntryPermissions),
      ...(accessRequestUserPermissions ? accessRequestUserPermissions : defaultAccessRequestPermissions),
    }),
    [accessRequestUserPermissions, entryUserPermissions],
  )

  return {
    userPermissions,
    setEntryId,
    setAccessRequestId,
  }
}
