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

export function useVolumeForModel(bucket: string = 'month', startDate?: string, endDate?: string) {
  const queryParams = {
    bucket,
    ...(startDate != undefined && { startDate }),
    ...(endDate != undefined && { endDate }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      data: ModelVolume
      ErrorInfo
    }[]
  >(`/api/v2/metrics/modelVolume?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateModelVolume: mutate,
    modelVolume: data ? data : [],
    isModelVolumeLoading: isLoading,
    isModelVolumeError: error,
  }
}

export function useGetGetOverviewMetrics() {
  const { data, isLoading, error } = useSWR<
    {
      global: OverviewBaseMetrics
      byOrganisation: OrganisationOverviewMetrics[]
    },
    ErrorInfo
  >('/api/v2/metrics', fetcher)

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
    },
    ErrorInfo
  >('/api/v2/metrics/policy', fetcher)

  return {
    mutateOverviewMetrics: mutate,
    policyMetrics: data ? data : undefined,
    isPolicyMetricsLoading: isLoading,
    isPolicyMetricsError: error,
  }
}
