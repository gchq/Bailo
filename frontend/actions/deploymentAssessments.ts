import qs from 'querystring'
import useSWR from 'swr'
import { DeploymentAssessmentInterface, DeploymentAssessmentUserPermissions } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetDeploymentAssessment(deploymentId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      deploymentAssessment: DeploymentAssessmentInterface
    },
    ErrorInfo
  >(deploymentId ? `/api/v3/deployment-assessments/${deploymentId}` : null, fetcher)

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
      permissions: DeploymentAssessmentUserPermissions
    },
    ErrorInfo
  >(
    deploymentAssessmentId ? `/api/v3/deployment-assessments/${deploymentAssessmentId}/permissions/mine` : null,
    fetcher,
  )

  return {
    mutateDeploymentAssessmentsUserPermissions: mutate,
    deploymentAssessmentsUserPermissions: data?.permissions,
    isDeploymentAssessmentsUserPermissionsLoading: isLoading,
    isDeploymentAssessmentsUserPermissionsError: error,
  }
}

export function useGetDeploymentAssessments(modelIds?: string[]) {
  const queryParams = {
    ...(modelIds && { modelIds }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      deploymentAssessments: DeploymentAssessmentInterface[]
    },
    ErrorInfo
  >(modelIds ? `/api/v3/deployment-assessments/?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateDeploymentAssessment: mutate,
    deploymentAssessments: data ? data.deploymentAssessments : [],
    isDeploymentAssessmentsLoading: isLoading,
    isDeploymentAssessmentsError: error,
  }
}
