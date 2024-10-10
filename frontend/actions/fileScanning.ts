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
    scanners: data ? data : emptyScannerList,
    isScannersLoading: isLoading,
    isScannersError: error,
  }
}
