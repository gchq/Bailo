import useSWR from 'swr'
import { ImageScanDetail, ModelImageWithScans } from 'types/types'
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

export function useGetImageScanResults(modelId: string, scanDetail: ImageScanDetail) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      images: ModelImageWithScans[]
    },
    ErrorInfo
  >(
    scanDetail ? `/api/v2/model/${modelId}/images?scanDetail=${scanDetail}` : `/api/v2/model/${modelId}/images`,
    fetcher,
  )

  return {
    imagesMutate: mutate,
    images: data ? data.images : emptyList,
    isImagesLoading: isLoading,
    isImagesError: error,
  }
}
