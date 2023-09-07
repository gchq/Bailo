import useSWRImmutable from 'swr/immutable'

import { UiConfig } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetUiConfig() {
  // TODO this is still using v1 config, this API might not change?
  const { data, error, mutate } = useSWRImmutable<UiConfig, ErrorInfo>('/api/v1/config/ui', fetcher)

  return {
    mutateUiConfig: mutate,
    uiConfig: data,
    isUiConfigLoading: !error && !data,
    isUiConfigError: error,
  }
}
