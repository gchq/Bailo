import useSWR from 'swr'
import { FileWithScanResultsInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetFilesForModel(modelId: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      files: FileWithScanResultsInterface[]
    },
    ErrorInfo
  >(`/api/v2/model/${modelId}/files`, fetcher)

  return {
    mutateFiles: mutate,
    files: data?.files,
    isFilesLoading: isLoading,
    isFilesError: error,
  }
}
