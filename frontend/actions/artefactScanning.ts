import useSWR from 'swr'
import { ModelImagesWithOptionalScanResults } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyList = []

export function useGetArtefactScannerInfo() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      scanners: string[]
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

export function useGetImageScanResults(modelId: string, name: string, tag: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      image: ModelImagesWithOptionalScanResults
    },
    ErrorInfo
  >(`/api/v2/model/${modelId}/image/${name}/${tag}`, fetcher)

  return {
    mutateImages: mutate,
    image: data?.image,
    isImageLoading: isLoading,
    isImageError: error,
  }
}
