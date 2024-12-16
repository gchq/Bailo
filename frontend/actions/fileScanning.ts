import useSWR from 'swr'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyScannerList = []

export function useGetFileScannerInfo() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      scanners: string[]
    },
    ErrorInfo
  >('/api/v2/filescanning/info', fetcher)

  return {
    scannersMutate: mutate,
    scanners: data ? data.scanners : emptyScannerList,
    isScannersLoading: isLoading,
    isScannersError: error,
  }
}

export function rerunFileScan(modelId: string, fileId: string) {
  return fetch(`/api/v2/filescanning/model/${modelId}/file/${fileId}/scan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
}
