import qs from 'querystring'
import useSWR from 'swr'
import { ModelVolume } from 'types/types'
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
    modelVolume: data ? data : [],
    isModelVolumeLoading: isLoading,
    isModelVolumeError: error,
  }
}
