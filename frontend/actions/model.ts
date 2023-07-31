import { ErrorInfo } from 'react'
import useSWR from 'swr'
import { ModelInterface } from 'types/interfaces'
import { fetcher } from 'utils/fetcher'

export function useGetModels() {
  const { data, error, mutate } = useSWR<
    {
      data: { models: ModelInterface[] }
    },
    ErrorInfo
  >('/api/v2/models/', fetcher)

  return {
    mutateModel: mutate,
    models: data ? data.data.models : undefined,
    isModelLoading: !error && !data,
    isModelError: error,
  }
}
