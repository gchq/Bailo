import axios, { AxiosProgressEvent } from 'axios'
import qs from 'querystring'
import useSWR from 'swr'
import { FileWithScanResultsInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyFilesList = []

export function useGetFilesForModel(modelId: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      files: FileWithScanResultsInterface[]
    },
    ErrorInfo
  >(`/api/v2/model/${modelId}/files`, fetcher)

  return {
    mutateFiles: mutate,
    files: data ? data.files : emptyFilesList,
    isFilesLoading: isLoading,
    isFilesError: error,
  }
}

export async function postFileForModelId(
  modelId: string,
  file: File,
  onUploadProgress: (progress: AxiosProgressEvent) => void,
  metadata?: string,
) {
  const mime = file.type || 'application/octet-stream'
  const fileResponse = await axios
    .post(
      metadata
        ? `/api/v2/model/${modelId}/files/upload/simple?name=${file.name}&mime=${mime}?${qs.stringify({
            metadata,
          })}`
        : `/api/v2/model/${modelId}/files/upload/simple?name=${file.name}&mime=${mime}`,
      file,
      {
        onUploadProgress,
      },
    )
    .catch(function (error) {
      if (error.response) {
        throw new Error(
          `Error code ${error.response.status} received from server whilst attempting to upload file ${file.name}`,
        )
      } else if (error.request) {
        throw new Error(`There was a problem with the request whilst attempting to upload file ${file.name}`)
      } else {
        throw new Error(`Unknown error whilst attempting to upload file ${file.name}`)
      }
    })
  return fileResponse
}
