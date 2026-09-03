import useSWR from 'swr'
import { DeploymentAssessmentInterface, DeploymentAssessmentUserPermissions } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export interface DeploymentAssessmentsQuery {
  schemaId?: string
  modelIds?: string | string[]
  riskOwner?: string
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  draft?: boolean
  search?: string
  state?: string
}

function buildDeploymentAssessmentsQueryString(query?: DeploymentAssessmentsQuery): string {
  if (!query) {
    return ''
  }

  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          params.append(key, String(item))
        }
      })
    } else {
      params.append(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export function useGetDeploymentAssessments(query?: DeploymentAssessmentsQuery) {
  const queryString = buildDeploymentAssessmentsQueryString(query)

  const { data, isLoading, error, mutate } = useSWR<
    {
      deploymentAssessments: DeploymentAssessmentInterface[]
    },
    ErrorInfo
  >(`/api/v3/deployment-assessments${queryString}`, fetcher)

  return {
    mutateDeploymentAssessments: mutate,
    deploymentAssessments: data?.deploymentAssessments ?? [],
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
