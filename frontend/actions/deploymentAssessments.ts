import qs from 'querystring'
import useSWR from 'swr'
import {
  DecisionKeys,
  DeploymentAssessmentInterface,
  DeploymentAssessmentStateKeys,
  DeploymentAssessmentSummary,
  DeploymentAssessmentUserPermissions,
  ReactionKindKeys,
} from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyDeploymentAssessmentList: DeploymentAssessmentSummary[] = []
const emptyDeploymentAssessmentCommentList: DeploymentAssessmentCommentHistory[] = []
const emptyDeploymentAssessmentReviewList: DeploymentAssessmentReviewHistory[] = []
const emptyDeploymentAssessmentReviewStatusList: DeploymentAssessmentReviewStatus[] = []

export type DeploymentAssessmentReaction = {
  kind: ReactionKindKeys
  users: string[]
}

export type DeploymentAssessmentCommentHistory = {
  id: string
  entity: string
  comment: string
  reactions: DeploymentAssessmentReaction[]
  commentEditedAt?: string
  createdAt: string
  updatedAt: string
}

export type DeploymentAssessmentReviewHistory = {
  id: string
  entity: string
  decision: Exclude<DecisionKeys, 'undo'>
  comment?: string
  reactions: DeploymentAssessmentReaction[]
  commentEditedAt?: string
  createdAt: string
  updatedAt: string
  outdated: boolean
}

export type DeploymentAssessmentReviewStatus = {
  role: string
  status: Exclude<DecisionKeys, 'undo'>
}

export type GetDeploymentAssessmentCommentsResponse = {
  id: string
  name: string
  comments: DeploymentAssessmentCommentHistory[]
}

export type GetDeploymentAssessmentReviewsResponse = {
  id: string
  name: string
  statuses: DeploymentAssessmentReviewStatus[]
  reviews: DeploymentAssessmentReviewHistory[]
}

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
    },
    ErrorInfo
  >(deploymentId ? `/api/v3/deployment-assessments/${deploymentId}` : null, fetcher)

  return {
    mutateDeploymentAssessment: mutate,
    deploymentAssessment: data && { ...data.deploymentAssessment, state: data.state },
    isDeploymentAssessmentLoading: isLoading,
    isDeploymentAssessmentError: error,
  }
}

export function useGetDeploymentAssessmentComments(deploymentAssessmentId?: string) {
  const { data, isLoading, error, mutate } = useSWR<GetDeploymentAssessmentCommentsResponse, ErrorInfo>(
    deploymentAssessmentId ? `/api/v3/deployment-assessments/${deploymentAssessmentId}/comments` : null,
    fetcher,
  )

  return {
    mutateDeploymentAssessmentComments: mutate,
    deploymentAssessmentComments: data?.comments ?? emptyDeploymentAssessmentCommentList,
    isDeploymentAssessmentCommentsLoading: isLoading,
    isDeploymentAssessmentCommentsError: error,
  }
}

export function useGetDeploymentAssessmentReviews(deploymentAssessmentId?: string) {
  const { data, isLoading, error, mutate } = useSWR<GetDeploymentAssessmentReviewsResponse, ErrorInfo>(
    deploymentAssessmentId ? `/api/v3/deployment-assessments/${deploymentAssessmentId}/reviews` : null,
    fetcher,
  )

  return {
    mutateDeploymentAssessmentReviews: mutate,
    deploymentAssessmentReviews: data?.reviews ?? emptyDeploymentAssessmentReviewList,
    deploymentAssessmentReviewStatuses: data?.statuses ?? emptyDeploymentAssessmentReviewStatusList,
    isDeploymentAssessmentReviewsLoading: isLoading,
    isDeploymentAssessmentReviewsError: error,
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
