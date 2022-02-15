import { Deployment } from '../types/interfaces'
import useSWR from 'swr'

import { fetcher } from 'utils/fetcher'
import { Types } from 'mongoose'

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

export function useGetUserDeployments(_id?: Types.ObjectId) {
  const { data, error, mutate } = useSWR<Array<Deployment>>(_id ? `/api/v1/deployment/user/${_id}` : null, fetcher, {
    refreshInterval: 1000,
  })

  return {
    mutateUserDeployments: mutate,
    userDeployments: data,
    isUserDeploymentsLoading: !error && !data,
    isUserDeploymentsError: error,
  }
}
