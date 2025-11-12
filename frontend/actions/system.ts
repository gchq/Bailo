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

  const peers: Map<string, PeerConfigStatus> = data?.peers ? new Map(Object.entries(data.peers)) : new Map()

  return {
    mutatePeersConfig: mutate,
    peers,
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
