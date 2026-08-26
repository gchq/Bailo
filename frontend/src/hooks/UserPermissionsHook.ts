import { useGetCurrentUserPermissionsForAccessRequest } from 'actions/accessRequest'
import { useGetCurrentUserPermissionsForDeploymentAssessment } from 'actions/deploymentAssessments'
import { useGetCurrentUserPermissionsForEntry } from 'actions/entry'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import {
  AccessRequestUserPermissions,
  DeploymentAssessmentUserPermissions,
  EntryUserPermissions,
  PermissionDetail,
  UserPermissions,
} from 'types/types'

export type UserPermissionsHook = {
  userPermissions: UserPermissions
}

const defaultPermissionDetail: PermissionDetail = {
  hasPermission: false,
  info: 'Fetching permissions...',
}

const defaultAccessRequestPermissions: AccessRequestUserPermissions = {
  editAccessRequest: defaultPermissionDetail,
  deleteAccessRequest: defaultPermissionDetail,
}

const defaultDeploymentAssessmentPermissions: DeploymentAssessmentUserPermissions = {
  editDeploymentAssessment: defaultPermissionDetail,
  deleteDeploymentAssessment: defaultPermissionDetail,
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

export const defaultUserPermissions = {
  ...defaultEntryPermissions,
  ...defaultAccessRequestPermissions,
  ...defaultDeploymentAssessmentPermissions,
}

export default function useUserPermissions(): UserPermissionsHook {
  const router = useRouter()
  const {
    modelId,
    dataCardId,
    accessRequestId,
    deploymentAssessmentId,
  }: { modelId?: string; dataCardId?: string; accessRequestId?: string; deploymentAssessmentId?: string } = router.query
  const entryId = modelId || dataCardId

  const { entryUserPermissions } = useGetCurrentUserPermissionsForEntry(entryId)
  const { accessRequestUserPermissions } = useGetCurrentUserPermissionsForAccessRequest(entryId, accessRequestId)
  const { deploymentAssessmentsUserPermissions } =
    useGetCurrentUserPermissionsForDeploymentAssessment(deploymentAssessmentId)

  const userPermissions = useMemo(
    () => ({
      ...(entryUserPermissions ? entryUserPermissions : defaultEntryPermissions),
      ...(accessRequestUserPermissions ? accessRequestUserPermissions : defaultAccessRequestPermissions),
      ...(deploymentAssessmentsUserPermissions
        ? deploymentAssessmentsUserPermissions
        : defaultDeploymentAssessmentPermissions),
    }),
    [accessRequestUserPermissions, deploymentAssessmentsUserPermissions, entryUserPermissions],
  )

  return {
    userPermissions,
  }
}
