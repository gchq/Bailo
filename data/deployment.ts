import { Deployment, PublicDeployment } from '../types/interfaces'
import useSWR from 'swr'

import { fetcher } from 'utils/fetcher'
import { Types } from 'mongoose'
import qs from 'qs'

export function useGetDeployment(uuid?: string) {
  const { data, error, mutate } = useSWR<Deployment>(uuid ? `/api/v1/deployment/${uuid}` : null, fetcher)

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

export function useGetPublicDeployment(uuid?: string) {
  const { data, error, mutate } = useSWR<PublicDeployment>(uuid ? `/api/v1/deployment/public/${uuid}` : null, fetcher)

  return {
    mutatePublicDeployment: mutate,
    publicDeployment: data,
    isPublicDeploymentLoading: !error && !data,
    isPublicDeploymentError: error,
  }
}

export function useGetPublicDeploymentByVersion(versionId?: string) {
  const { data, error, mutate } = useSWR<PublicDeployment>(versionId ? `/api/v1/deployment/public/version/${versionId}` : null, fetcher)

  return {
    mutatePublicDeploymentVersion: mutate,
    publicDeploymentVersion: data,
    isPublicDeploymentVersionLoading: !error && !data,
    isPublicDeploymentVersionError: error,
  }
}

export function listPublicDeployments(filter?: string) {
  const { data, error, mutate } = useSWR<{
    models: Array<PublicDeployment>
  }>(
    `/api/v1/deployments/public?${qs.stringify({
      filter,
    })}`,
    fetcher
  )

  return {
    mutatePublicDeployment: mutate,
    publicDeployments: data?.models,
    isPublicDeploymentsLoading: !error && !data,
    isPublicDeploymentsError: error,
  }
}
