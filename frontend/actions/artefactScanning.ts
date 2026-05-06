import useSWR from 'swr'
import { ImageTagResult, ScanInfoInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyList = []

export function useGetArtefactScannerInfo() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      scanners: ScanInfoInterface[]
    },
    ErrorInfo
  >('/api/v2/filescanning/info', fetcher)

  return {
    scannersMutate: mutate,
    scanners: data ? data.scanners : emptyList,
    isScannersLoading: isLoading,
    isScannersError: error,
  }
}

export function rerunArtefactScan(modelId: string, artefactId: string) {
  return fetch(`/api/v2/filescanning/model/${modelId}/file/${artefactId}/scan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function rerunImageArtefactScan(modelId: string, name: string, tag: string) {
  const encodedName = encodeURIComponent(name)
  return fetch(`/api/v2/filescanning/model/${modelId}/image/${encodedName}/${tag}/scan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function useGetImageScanResults(
  modelId: string,
  name: string,
  tag: string,
  digest: string,
  isRouterReady?: boolean,
) {
  const encodedName = encodeURIComponent(name)
  const { data, isLoading, error, mutate } = useSWR<
    {
      imageBreakdown: ImageTagResult
    },
    ErrorInfo
  >(isRouterReady ? `/api/v3/model/${modelId}/image/${encodedName}/${tag}/${digest}` : null, fetcher)

  return {
    mutateImage: mutate,
    image: data?.imageBreakdown,
    isImageLoading: isLoading,
    isImageError: error,
  }
}
