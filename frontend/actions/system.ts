import useSWRImmutable from 'swr/immutable'

import { PeerConfigStatus, SystemStatus } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetPeers() {
  const { data, isLoading, error, mutate } = useSWRImmutable<
    {
      peers: Map<string, PeerConfigStatus>
    },
    ErrorInfo
  >('/api/v2/system/peers', fetcher)

  return {
    mutatePeersConfig: mutate,
    peers: data?.peers,
    isPeersLoading: isLoading,
    isPeersError: error,
  }
}

export function useGetStatus() {
  const { data, isLoading, error, mutate } = useSWRImmutable<SystemStatus, ErrorInfo>('/api/v2/system/status', fetcher)

  return {
    mutateStatus: mutate,
    status: data,
    isStatusLoading: isLoading,
    isStatusError: error,
  }
}
