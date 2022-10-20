import { Types } from 'mongoose'
import useSWR from 'swr'
import { fetcher } from 'utils/fetcher'
import { Deployment } from '../types/interfaces'

export function useGetDeployment(uuid?: string, logs = false) {
  const { data, error, mutate } = useSWR<Deployment>(uuid ? `/api/v1/deployment/${uuid}?logs=${logs}` : null, fetcher)

  return {
    mutateDeployment: mutate,
    deployment: data,
    isDeploymentLoading: !error && !data,
    isDeploymentError: error,
  }
}

export function useGetUserDeployments(_id?: string | Types.ObjectId) {
  const { data, error, mutate } = useSWR<Array<Deployment>>(_id ? `/api/v1/deployment/user/${_id}` : null, fetcher)

  return {
    mutateUserDeployments: mutate,
    userDeployments: data,
    isUserDeploymentsLoading: !error && !data,
    isUserDeploymentsError: error,
  }
}
