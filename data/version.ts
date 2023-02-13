import useSWR from 'swr'
import { fetcher } from '../utils/fetcher'

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
