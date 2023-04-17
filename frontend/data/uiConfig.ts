import useSWRImmutable from 'swr/immutable'

import { UiConfig } from '../../lib/shared/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetUiConfig() {
  const { data, error, mutate } = useSWRImmutable<UiConfig, ErrorInfo>('/api/v1/config/ui', fetcher)

  return {
    mutateUiConfig: mutate,
    uiConfig: data,
    isUiConfigLoading: !error && !data,
    isUiConfigError: error,
  }
}
