import qs from 'querystring'
import useSWR from 'swr'
import {
  DeploymentAssessmentInterface,
  DeploymentAssessmentStateKeys,
  DeploymentAssessmentSummary,
  DeploymentAssessmentUserPermissions,
  ResponseInterface,
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
  needsAction?: boolean
}

export function buildDeploymentAssessmentsUrl(filters: DeploymentAssessmentFilters = {}): string {
  const queryParams: Record<string, string | string[] | boolean> = {}

  if (filters.schemaId) {
    queryParams.schemaId = filters.schemaId
  }

  if (filters.modelIds?.length) {
    queryParams.modelIds = filters.modelIds
  }

  if (filters.riskOwner) {
    queryParams.riskOwner = filters.riskOwner
  }

  if (filters.createdBy) {
    queryParams.createdBy = filters.createdBy
  }

  if (filters.createdAfter) {
    queryParams.createdAfter = filters.createdAfter
  }

  if (filters.createdBefore) {
    queryParams.createdBefore = filters.createdBefore
  }

  if (filters.draft !== undefined) {
    queryParams.draft = filters.draft
  }

  if (filters.search) {
    queryParams.search = filters.search
  }

  if (filters.state) {
    queryParams.state = filters.state
  }

  if (filters.needsAction !== undefined) {
    queryParams.needsAction = filters.needsAction
  }

  const queryString = qs.stringify(queryParams)

  return `/api/v3/deployment-assessments${queryString ? `?${queryString}` : ''}`
}

export function useGetDeploymentAssessments(filters: DeploymentAssessmentFilters = {}, enabled = true) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      deploymentAssessments: DeploymentAssessmentSummary[]
    },
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
      state: DeploymentAssessmentStateKeys
      responses?: ResponseInterface[]
    },
    ErrorInfo
  >(deploymentId ? `/api/v3/deployment-assessments/${deploymentId}` : null, fetcher)

  return {
    mutateDeploymentAssessment: mutate,
    deploymentAssessment: data && { ...data?.deploymentAssessment, state: data?.state, respones: data?.responses },
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
