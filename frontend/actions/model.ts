import axios from 'axios'
import qs from 'querystring'
import useSWR from 'swr'

import { ListModelType, ModelForm, ModelInterface } from '../types/types'
import { handleAxiosError } from '../utils/axios'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useListModels(type: ListModelType, filter?: string) {
  const { data, error, mutate } = useSWR<
    {
      data: { models: ModelInterface[] }
    },
    ErrorInfo
  >(
    `/api/v2/models?${qs.stringify({
      type,
      filter,
    })}`,
    fetcher
  )

  return {
    mutateModels: mutate,
    models: data ? data.data.models : [],
    isModelsLoading: !error && !data,
    isModelsError: error,
  }
}

export function useGetModel(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      data: { model: ModelInterface }
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}` : null, fetcher)

  return {
    mutateModel: mutate,
    model: data ? data.data.model : undefined,
    isModelLoading: !error && !data,
    isModelError: error,
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
    return { status: response.status, data: response.data.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}
