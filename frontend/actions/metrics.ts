import qs from 'querystring'
import useSWR, { mutate } from 'swr'
import {
  ModelVolume,
  OrganisationOverviewMetrics,
  OrganisationPolicyMetrics,
  OverviewBaseMetrics,
  PolicyBaseMetrics,
} from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetModelVolumeMetrics(
  period: string = 'month',
  startDate?: string,
  endDate?: string,
  organisation?: string,
) {
  const queryParams = {
    period,
    ...(startDate != undefined && { startDate }),
    ...(endDate != undefined && { endDate }),
    ...(organisation != undefined && { organisation }),
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      modelVolume: ModelVolume
    },
    ErrorInfo
  >(`/api/v2/schemas?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateModelVolume: mutate,
    modelVolume: data,
    isModelVolumeLoading: isLoading,
    isModelVolumeError: error,
  }
}

export function useGetVolumeForModel(interval: string = 'month', startDate?: string, endDate?: string) {
  const queryParams = {
    interval,
    ...(startDate != undefined && { startDate }),
    ...(endDate != undefined && { endDate }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      data: ModelVolume
    }[]
  >(`/api/v3/metrics/entryVolume?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateModelVolume: mutate,
    modelVolume: data,
    isModelVolumeLoading: isLoading,
    isModelVolumeError: error,
  }
}

export function useGetOverviewMetrics() {
  const { data, isLoading, error } = useSWR<
    {
      global: OverviewBaseMetrics
      byOrganisation: OrganisationOverviewMetrics[]
      lastUpdated: string
    },
    ErrorInfo
  >('/api/v3/metrics/usage', fetcher)

  return {
    mutateOverviewMetrics: mutate,
    overviewMetrics: data ? data : undefined,
    isOverviewMetricsLoading: isLoading,
    isOverviewMetricsError: error,
  }
}

export function useGetPolicyMetrics() {
  const { data, isLoading, error } = useSWR<
    {
      global: PolicyBaseMetrics
      byOrganisation: OrganisationPolicyMetrics[]
      lastUpdated: string
    },
    ErrorInfo
  >('/api/v3/metrics/compliance', fetcher)

  return {
    mutateOverviewMetrics: mutate,
    policyMetrics: data ? data : undefined,
    isPolicyMetricsLoading: isLoading,
    isPolicyMetricsError: error,
  }
}
