import useSWRImmutable from 'swr/immutable'
import { UiConfig } from '../types/interfaces'
import { fetcher } from '../utils/fetcher'

export function useGetUiConfig() {
  const { data, error, mutate } = useSWRImmutable<UiConfig>('/api/v1/config', fetcher)

  return {
    mutateUiConfig: mutate,
    uiConfig: data,
    isUiConfigLoading: !error && !data,
    isUiConfigError: error,
  }
}
