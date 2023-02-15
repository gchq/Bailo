import useSWR from 'swr'
import qs from 'qs'
import { fetcher, textFetcher } from '../utils/fetcher'
import { MinimalEntry } from '../types/interfaces'

interface VersionAccess {
  uploader: boolean
  reviewer: boolean
  manager: boolean
}

export function useGetVersionAccess(id?: string) {
  const { data, error, mutate } = useSWR<VersionAccess>(id ? `/api/v1/version/${id}/access` : null, fetcher)

  return {
    mutateVersionAccess: mutate,
    versionAccess: data,
    isVersionAccessLoading: !error && !data,
    isVersionAccessError: error,
  }
}

interface FileListResponse {
  fileList: Array<MinimalEntry>
}

export function useGetVersionFileList(id?: string, file = 'code') {
  const { data, error, mutate } = useSWR<FileListResponse>(
    id ? `/api/v1/version/${id}/contents/${file}/list` : null,
    fetcher
  )

  return {
    mutateFileList: mutate,
    fileList: data,
    isFileListLoading: !error && !data,
    isFileListError: error,
  }
}

export function useGetVersionFile(id?: string, path?: string, file = 'code') {
  const { data, error, mutate } = useSWR(
    id && path
      ? `/api/v1/version/${id}/contents/${file}?${qs.stringify({
          path,
        })}`
      : null,
    textFetcher
  )

  return {
    mutateFile: mutate,
    file: data,
    isFileLoading: !error && !data,
    isFileError: error,
  }
}
