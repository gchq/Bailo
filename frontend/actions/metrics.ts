import qs from 'querystring'
import useSWR from 'swr'
import { BaseNoReleaseMetrics, CollaboratorEntry, ModelVolume, OverviewMetrics, PolicyRoleMetrics } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetVolumeForModel(interval: string = 'month', startDate?: string, endDate?: string) {
  const queryParams = {
    interval,
    ...(startDate != undefined && { startDate }),
    ...(endDate != undefined && { endDate }),
  }
  const { data, isLoading, error, mutate } = useSWR<ModelVolume>(
    `/api/v3/metrics/entryVolume?${qs.stringify(queryParams)}`,
    fetcher,
  )

  return {
    mutateModelVolume: mutate,
    modelVolume: data,
    isModelVolumeLoading: isLoading,
    isModelVolumeError: error,
  }
}

export function useGetOverviewMetrics() {
  const { data, isLoading, error, mutate } = useSWR<OverviewMetrics, ErrorInfo>('/api/v3/metrics/usage', fetcher)

  return {
    mutateOverviewMetrics: mutate,
    overviewMetrics: data,
    isOverviewMetricsLoading: isLoading,
    isOverviewMetricsError: error,
  }
}

export function useGetRolePolicyMetrics() {
  const { data, isLoading, error, mutate } = useSWR<PolicyRoleMetrics, ErrorInfo>(
    '/api/v3/metrics/compliance/roles',
    fetcher,
  )

  return {
    mutateRolePolicyMetrics: mutate,
    rolePolicyMetrics: data,
    isRolePolicyMetricsLoading: isLoading,
    isRolePolicyMetricsError: error,
  }
}

export function useGetNoReleasesPolicyMetrics() {
  const { data, isLoading, error, mutate } = useSWR<BaseNoReleaseMetrics, ErrorInfo>(
    '/api/v3/metrics/compliance/no-releases',
    fetcher,
  )

  return {
    mutateNoReleasesPolicyMetrics: mutate,
    noReleasesPolicyMetrics: data,
    isNoReleasesPolicyMetricsLoading: isLoading,
    isNoReleasesPolicyMetricsError: error,
  }
}

export interface ModelBreakdownResponse {
  entryId: string
  entryName: string
  entryKind: string
  collaborators: CollaboratorEntry[]
}

interface UseGetModelBreakdownParams {
  organisation?: string
  state?: string
  schemaId?: string
  release?: string
  accessRequest?: string
  startMonth?: string
  endMonth?: string
}

export function useGetModelBreakdown({
  organisation,
  state,
  schemaId,
  release,
  accessRequest,
  startMonth,
  endMonth,
}: UseGetModelBreakdownParams) {
  const queryParams = {
    ...(organisation && { organisation }),
    ...(state && { state }),
    ...(schemaId && { schemaId }),
    ...(release && { release }),
    ...(accessRequest && { accessRequest }),
    ...(startMonth && { startMonth }),
    ...(endMonth && { endMonth }),
  }

  const { data, isLoading, error, mutate } = useSWR<ModelBreakdownResponse[], ErrorInfo>(
    `/api/v3/metrics/breakdown?${qs.stringify(queryParams)}`,
    fetcher,
  )

  return {
    mutateEntries: mutate,
    entries: data,
    isEntriesLoading: isLoading,
    isEntriesError: error,
  }
}
