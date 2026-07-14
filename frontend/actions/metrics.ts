import qs from 'querystring'
import useSWR from 'swr'
import { CollaboratorEntry, ModelVolume, OverviewMetrics, PolicyMetrics } from 'types/types'
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

export function useGetPolicyMetrics() {
  const { data, isLoading, error, mutate } = useSWR<PolicyMetrics, ErrorInfo>('/api/v3/metrics/compliance', fetcher)

  return {
    mutatePolicyMetrics: mutate,
    policyMetrics: data,
    isPolicyMetricsLoading: isLoading,
    isPolicyMetricsError: error,
  }
}

export interface ModelBreakdownResponse {
  entryId: string
  entryName: string
  collaborators: CollaboratorEntry[]
}

interface UseGetModelBreakdownParams {
  organisation?: string
  state?: string
  schemaId?: string
}

export function useGetModelBreakdown({ organisation, state, schemaId }: UseGetModelBreakdownParams) {
  const queryParams = {
    ...(organisation && { organisation }),
    ...(state && { state }),
    ...(schemaId && { schemaId }),
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
