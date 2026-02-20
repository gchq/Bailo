import useSWR from 'swr'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyScannerList = []

export function useGetArtefactScannerInfo() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      scanners: string[]
    },
    ErrorInfo
  >('/api/v2/artefactscanning/info', fetcher)

  return {
    scannersMutate: mutate,
    scanners: data ? data.scanners : emptyScannerList,
    isScannersLoading: isLoading,
    isScannersError: error,
  }
}

export function rerunArtefactScan(modelId: string, artefactId: string) {
  return fetch(`/api/v2/artefactscanning/model/${modelId}/file/${artefactId}/scan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
}
