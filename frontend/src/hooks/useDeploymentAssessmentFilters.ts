import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { DeploymentAssessmentState, DeploymentAssessmentStateKeys } from 'types/types'

export const DeploymentAssessmentStatus = {
  DRAFT: 'draft',
  ...DeploymentAssessmentState,
} as const

export type DeploymentAssessmentStatusKeys =
  (typeof DeploymentAssessmentStatus)[keyof typeof DeploymentAssessmentStatus]

export interface DeploymentAssessmentPageFilters {
  search?: string
  status?: DeploymentAssessmentStatusKeys
  modelIds: string[]
  riskOwner?: string
  createdBy?: string
  schemaId?: string
  createdAfter?: string
  createdBefore?: string
}

export function buildDeploymentAssessmentListHref(filters: DeploymentAssessmentPageFilters): string {
  const query = new URLSearchParams({ tab: 'all-assessments' })

  if (filters.search) {
    query.set('search', filters.search)
  }
  if (filters.status) {
    query.set('status', filters.status)
  }
  filters.modelIds.forEach((modelId) => query.append('modelIds', modelId))
  if (filters.riskOwner) {
    query.set('riskOwner', filters.riskOwner)
  }
  if (filters.createdBy) {
    query.set('createdBy', filters.createdBy)
  }
  if (filters.schemaId) {
    query.set('schemaId', filters.schemaId)
  }
  if (filters.createdAfter) {
    query.set('createdAfter', filters.createdAfter)
  }
  if (filters.createdBefore) {
    query.set('createdBefore', filters.createdBefore)
  }

  return `/deployment-assessments?${query.toString()}`
}

function readString(value: string | string[] | undefined) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readArray(value: string | string[] | undefined) {
  if (!value) {
    return []
  }
  return [...new Set(Array.isArray(value) ? value.filter(Boolean) : [value])]
}

function readStatus(value: string | string[] | undefined): DeploymentAssessmentStatusKeys | undefined {
  const status = readString(value)
  return Object.values(DeploymentAssessmentStatus).includes(status as DeploymentAssessmentStatusKeys)
    ? (status as DeploymentAssessmentStatusKeys)
    : undefined
}

export function useDeploymentAssessmentFilters() {
  const router = useRouter()

  const filters = useMemo<DeploymentAssessmentPageFilters>(
    () => ({
      search: readString(router.query.search),
      status: readStatus(router.query.status),
      modelIds: readArray(router.query.modelIds),
      riskOwner: readString(router.query.riskOwner),
      createdBy: readString(router.query.createdBy),
      schemaId: readString(router.query.schemaId),
      createdAfter: readString(router.query.createdAfter),
      createdBefore: readString(router.query.createdBefore),
    }),
    [router.query],
  )

  const setFilters = useCallback(
    (updates: Partial<DeploymentAssessmentPageFilters>) => {
      const next = { ...filters, ...updates }
      router.replace(buildDeploymentAssessmentListHref(next), undefined, { shallow: true })
    },
    [filters, router],
  )

  const resetFilters = useCallback(() => {
    router.replace({ pathname: '/deployment-assessments', query: { tab: 'all-assessments' } }, undefined, {
      shallow: true,
    })
  }, [router])

  return { filters, setFilters, resetFilters }
}

export function statusToApiFilters(status?: DeploymentAssessmentStatusKeys): {
  draft?: boolean
  state?: DeploymentAssessmentStateKeys
} {
  if (status === DeploymentAssessmentStatus.DRAFT) {
    return { draft: true }
  }
  if (!status) {
    return {}
  }
  return { state: status as DeploymentAssessmentStateKeys }
}
