import useSWR from 'swr'
import { DeploymentAssessmentInterface, DeploymentAssessmentPermissions } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetDeploymentAssessment(deploymentId: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      deploymentAssessment: DeploymentAssessmentInterface
    },
    ErrorInfo
  >(`/api/v3/deployment-assessments/${deploymentId}`, fetcher)

  return {
    mutateDeploymentAssessment: mutate,
    deploymentAssessment: data?.deploymentAssessment,
    isDeploymentAssessmentLoading: isLoading,
    isDeploymentAssessmentError: error,
  }
}

export function useGetCurrentUserPermissionsForDeploymentAssessment(deploymentAssessmentId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      permissions: DeploymentAssessmentPermissions
    },
    ErrorInfo
  >(
    deploymentAssessmentId ? `/api/v3/deployment-assessments/${deploymentAssessmentId}/permissions/mine` : null,
    fetcher,
  )

  return {
    mutateDeploymentAssessmentsUserPermissions: mutate,
    deploymentAssessmentsUserPermissions: data?.permissions,
    isDeploymentAssessmentstUserPermissionsLoading: isLoading,
    isDeploymentAssessmentsUserPermissionsError: error,
  }
}
