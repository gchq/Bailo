import { Deployment } from '../types/interfaces'
import useSWR from 'swr'

import { fetcher } from 'utils/fetcher'

export function useGetDeployment(uuid?: string) {
  const { data, error, mutate } = useSWR<Deployment>(uuid ? `/api/v1/deployment/${uuid}` : null, fetcher, {
    refreshInterval: 1000,
  })

  return {
    mutateDeployment: mutate,
    deployment: data,
    isDeploymentLoading: !error && !data,
    isDeploymentError: error,
  }
}
