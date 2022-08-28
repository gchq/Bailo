import qs from 'qs'
import useSWR from 'swr'
import { Deployment, Model, Schema, Version } from '../types/interfaces'
import { fetcher } from '../utils/fetcher'

export type ListModelType = 'favourites' | 'user' | 'all'
export function useListModels(type: ListModelType, filter?: string) {
  const { data, error, mutate } = useSWR<{
    models: Array<Model>
  }>(
    `/api/v1/models?${qs.stringify({
      type,
      filter,
    })}`,
    fetcher
  )

  return {
    mutateModels: mutate,
    models: data ? data.models : undefined,
    isModelsLoading: !error && !data,
    isModelsError: error,
  }
}

export function useGetModel(uuid?: string) {
  const { data, error, mutate } = useSWR<Model>(uuid ? `/api/v1/model/uuid/${uuid}` : null, fetcher)

  return {
    mutateModel: mutate,
    model: data,
    isModelLoading: !error && !data,
    isModelError: error,
  }
}

export function useGetModelById(id?: string) {
  const { data, error, mutate } = useSWR<Model>(id ? `/api/v1/model/id/${id}` : null, fetcher)

  return {
    mutateModel: mutate,
    model: data,
    isModelLoading: !error && !data,
    isModelError: error,
  }
}

export function useGetModelSchema(uuid?: string) {
  const { data, error, mutate } = useSWR<Schema>(uuid ? `/api/v1/model/${uuid}/schema` : null, fetcher)

  return {
    mutateSchema: mutate,
    schema: data,
    isSchemaLoading: !error && !data,
    isSchemaError: error,
  }
}

export function useGetModelVersions(uuid?: string) {
  const { data, error, mutate } = useSWR<Array<Version>>(uuid ? `/api/v1/model/${uuid}/versions` : null, fetcher)

  return {
    mutateVersions: mutate,
    versions: data,
    isVersionsLoading: !error && !data,
    isVersionsError: error,
  }
}

export function useGetModelVersion(uuid?: string, selectedVersion?: string) {
  const getVersion = selectedVersion || 'latest'

  const { data, error, mutate } = useSWR<Version>(
    uuid ? `/api/v1/model/${uuid}/version/${getVersion}` : null,
    fetcher,
    {
      refreshInterval: 1000,
    }
  )

  return {
    mutateVersion: mutate,
    version: data,
    isVersionLoading: !error && !data,
    isVersionError: error,
  }
}

export function useGetModelDeployments(uuid?: string) {
  const { data, error, mutate } = useSWR<Array<Deployment>>(uuid ? `/api/v1/model/${uuid}/deployments` : null, fetcher)

  return {
    mutateDeployments: mutate,
    deployments: data,
    isDeploymentsLoading: !error && !data,
    isDeploymentsError: error,
  }
}
