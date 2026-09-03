import qs from 'querystring'
import useSWR from 'swr'
import {
  DeploymentAssessmentInterface,
  DeploymentAssessmentSummary,
  DeploymentAssessmentUserPermissions,
} from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyDeploymentAssessmentList: DeploymentAssessmentSummary[] = []

export interface DeploymentAssessmentSearchParams {
  needsAction?: boolean
}

export function useGetDeploymentAssessments({ needsAction }: DeploymentAssessmentSearchParams = {}) {
  // Omit rather than pass undefined, which stringifies to an empty value the API rejects
  const queryParams = { ...(needsAction !== undefined && { needsAction }) }
  const { data, isLoading, error, mutate } = useSWR<
    {
      deploymentAssessments: DeploymentAssessmentSummary[]
    },
    ErrorInfo
  >(`/api/v3/deployment-assessments?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateDeploymentAssessments: mutate,
    deploymentAssessments: data ? data.deploymentAssessments : emptyDeploymentAssessmentList,
    isDeploymentAssessmentsLoading: isLoading,
    isDeploymentAssessmentsError: error,
  }
}

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

export function deleteDeploymentAssessment(deploymentAssessmentId: string) {
  return fetch(`/api/v3/deployment-assessments/${deploymentAssessmentId}`, {
    method: 'delete',
  })
}
