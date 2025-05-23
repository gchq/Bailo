import useSWRImmutable from 'swr/immutable'

import { RemoteFederationConfig } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetPeers() {
  const { data, isLoading, error, mutate } = useSWRImmutable<
    {
      peers: Map<string, RemoteFederationConfig>
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
