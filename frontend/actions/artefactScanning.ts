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
  const encodedTag = encodeURIComponent(tag)
  return fetch(`/api/v2/filescanning/model/${modelId}/image/${encodedName}/${encodedTag}/scan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function useGetImageScanResults(modelId: string, name: string, tag: string, digest: string) {
  const encodedName = encodeURIComponent(name)
  const encodedTag = encodeURIComponent(tag)
  const encodedDigest = encodeURIComponent(digest)
  const { data, isLoading, error, mutate } = useSWR<
    {
      imageBreakdown: ImageTagResult
    },
    ErrorInfo
  >(`/api/v3/model/${modelId}/image/${encodedName}/${encodedTag}/${encodedDigest}`, fetcher)

  return {
    mutateImage: mutate,
    image: data?.imageBreakdown,
    isImageLoading: isLoading,
    isImageError: error,
  }
}
