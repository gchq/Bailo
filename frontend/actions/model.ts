import qs from 'querystring'
import useSWR from 'swr'

import { ModelForm, ModelImage, ModelInterface, Role } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export interface ModelSearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
}

export function useListModels(filters: string[] = [], task = '', libraries: string[] = [], search = '') {
  const queryParams = {
    ...(filters.length > 0 && { filters }),
    ...(task && { task }),
    ...(libraries.length > 0 && { libraries }),
    ...(search && { search }),
  }
  const { data, error, mutate } = useSWR<
    {
      models: ModelSearchResult[]
    },
    ErrorInfo
  >(queryParams ? `/api/v2/models/search?${qs.stringify(queryParams)}` : `/api/v2/models/search`, fetcher)

  return {
    mutateModels: mutate,
    models: data ? data.models : [],
    isModelsLoading: !error && !data,
    isModelsError: error,
  }
}

export function useGetModel(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      model: ModelInterface
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}` : null, fetcher)

  return {
    mutateModel: mutate,
    model: data ? data.model : undefined,
    isModelLoading: !error && !data,
    isModelError: error,
  }
}

export function useGetModelRoles(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      roles: Role[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/roles` : null, fetcher)

  return {
    mutateModelRoles: mutate,
    modelRoles: data ? data.roles : [],
    isModelRolesLoading: !error && !data,
    isModelRolesError: error,
  }
}

export function useGetModelImages(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      images: ModelImage[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/images` : null, fetcher)

  return {
    mutateModelImages: mutate,
    modelImages: data ? data.images : [],
    isModelImagesLoading: !error && !data,
    isModelImagesError: error,
  }
}

export function useGetModelRolesCurrentUser(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      roles: Role[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/roles/mine` : null, fetcher)

  return {
    mutateModelRolesCurrentUser: mutate,
    modelRolesCurrentUser: data ? data.roles : [],
    isModelRolesCurrentUserLoading: !error && !data,
    isModelRolesCurrentUserError: error,
  }
}

export async function postModel(form: ModelForm) {
  return fetch(`/api/v2/models`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
}

export async function patchModel(
  id: string,
  delta: Partial<Pick<ModelInterface, 'name' | 'description' | 'collaborators' | 'visibility' | 'settings'>>,
) {
  return fetch(`/api/v2/model/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delta),
  })
}
