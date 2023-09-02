import axios from 'axios'
import qs from 'querystring'
import useSWR from 'swr'

import { ListModelType } from '../types/types'
import { ModelForm, ModelInterface, Role } from '../types/v2/types'
import { handleAxiosError } from '../utils/axios'
import { ErrorInfo, fetcher } from '../utils/fetcher'

interface ModelSearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
}

export function useListModels(type: ListModelType, filter?: string) {
  const { data, error, mutate } = useSWR<
    {
      models: ModelSearchResult[]
    },
    ErrorInfo
  >(
    `/api/v2/models/search?${qs.stringify({
      type,
      filter,
    })}`,
    fetcher,
  )

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
  try {
    const response = await axios({
      method: 'post',
      url: '/api/v2/models',
      headers: { 'Content-Type': 'application/json' },
      data: form,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

export async function patchModel(model: ModelInterface) {
  try {
    const response = await axios({
      method: 'patch',
      url: `/api/v2/model/${model.id}`,
      headers: { 'Content-Type': 'application/json' },
      data: model,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}
