import qs from 'querystring'
import useSWR from 'swr'
import {
  DeploymentAssessmentInterface,
  DeploymentAssessmentStateKeys,
  DeploymentAssessmentSummary,
  DeploymentAssessmentUserPermissions,
} from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyDeploymentAssessmentList: DeploymentAssessmentSummary[] = []

export interface DeploymentAssessmentFilters {
  schemaId?: string
  modelIds?: string[]
  riskOwner?: string
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  draft?: boolean
  search?: string
  state?: DeploymentAssessmentStateKeys
}

export function buildDeploymentAssessmentsUrl(filters: DeploymentAssessmentFilters): string {
  const query = new URLSearchParams()

  if (filters.schemaId) {
    query.set('schemaId', filters.schemaId)
  }
  filters.modelIds?.forEach((modelId) => query.append('modelIds', modelId))
  if (filters.riskOwner) {
    query.set('riskOwner', filters.riskOwner)
  }
  if (filters.createdBy) {
    query.set('createdBy', filters.createdBy)
  }
  if (filters.createdAfter) {
    query.set('createdAfter', filters.createdAfter)
  }
  if (filters.createdBefore) {
    query.set('createdBefore', filters.createdBefore)
  }
  if (filters.draft !== undefined) {
    query.set('draft', String(filters.draft))
  }
  if (filters.search) {
    query.set('search', filters.search)
  }
  if (filters.state) {
    query.set('state', filters.state)
  }

  const queryString = query.toString()
  return `/api/v3/deployment-assessments${queryString ? `?${queryString}` : ''}`
}

export function useGetDeploymentAssessments(filters: DeploymentAssessmentFilters = {}, enabled = true) {
  const { data, isLoading, error, mutate } = useSWR<
    { deploymentAssessments: DeploymentAssessmentSummary[] },
    ErrorInfo
  >(enabled ? buildDeploymentAssessmentsUrl(filters) : null, fetcher)

  return {
    mutateDeploymentAssessments: mutate,
    deploymentAssessments: data?.deploymentAssessments ?? emptyDeploymentAssessmentList,
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
