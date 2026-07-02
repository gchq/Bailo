import useSWRImmutable from 'swr/immutable'

import { UiConfig } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetUiConfig() {
  const { data, isLoading, error, mutate } = useSWRImmutable<
    {
      uiConfig: UiConfig
    },
    ErrorInfo
  >('/api/v2/config/ui', fetcher)

  if (isLoading) {
    return {
      isUiConfigLoading: isLoading,
    }
  }

  if (error) {
    return {
      isUiConfigError: error,
    }
  }

  if (!data || !data.uiConfig) {
    return {
      isUiConfigError: {
        ...new Error('Unable to get data for the current user'),
        info: { message: 'Unable to get data for the current user' },
        status: 500,
      },
    }
  }

  return {
    mutateUiConfig: mutate,
    uiConfig: data.uiConfig,
  }
}
