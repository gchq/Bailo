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

function multiFetcher<T>(urls: string[]): Promise<T[]> {
  return Promise.all(urls.map((url) => fetcher<false>(url)))
}

const mockedTimelineData = [
  {
    increment: '01/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '02/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '03/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '04/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '05/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '06/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '07/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '08/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '09/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '10/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '11/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
  {
    increment: '12/2026',
    count: 3,
    organisations: [
      { organisation: 'Example Organisation', count: 2 },
      { organisation: 'unset', count: 1 },
    ],
  },
]

export function useVolumeForModel(
  organisations: string[],
  period: string = 'month',
  startDate?: string,
  endDate?: string,
) {
  const queryParams = {
    period,
    ...(startDate != undefined && { startDate }),
    ...(endDate != undefined && { endDate }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      data: ModelVolume
      ErrorInfo
    }[]
  >(
    organisations.map(
      (organisation) => `/api/v2/metrics/modelVolume?organisation=${organisation}&${qs.stringify(queryParams)}`,
    ),
    multiFetcher,
  )

  return {
    mutateModelVolume: mutate,
    modelVolume: data ? mockedTimelineData : [],
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
