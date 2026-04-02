import qs from 'querystring'
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
  const encodedModelId = encodeURIComponent(modelId)
  const encodedName = encodeURIComponent(name)
  const encodedTag = encodeURIComponent(tag)
  return fetch(`/api/v2/filescanning/model/${encodedModelId}/image/${encodedName}/${encodedTag}/scan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function useGetImageScanResults(modelId: string, name: string, tag: string, platform?: string) {
  const encodedModelId = encodeURIComponent(modelId)
  const encodedName = encodeURIComponent(name)
  const encodedTag = encodeURIComponent(tag)
  const queryParams = {
    ...(platform && { platform }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      imageBreakdown: ImageTagResult
    },
    ErrorInfo
  >(
    Object.entries(queryParams).length > 0
      ? `/api/v2/model/${encodedModelId}/image/${encodedName}/${encodedTag}?${qs.stringify(queryParams)}`
      : `/api/v2/model/${encodedModelId}/image/${encodedName}/${encodedTag}`,
    fetcher,
  )

  return {
    mutateImages: mutate,
    image: data?.imageBreakdown,
    isImageLoading: isLoading,
    isImageError: error,
  }
}
