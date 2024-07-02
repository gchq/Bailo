import { Buffer } from 'buffer'
import useSWR from 'swr'
import { InferenceInterface, TokenInterface } from 'types/types'

import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetInferencesForModelId(modelId: string) {
  const { data, error, mutate } = useSWR<
    {
      inferences: InferenceInterface[]
    },
    ErrorInfo
  >(`/api/v2/model/${modelId}/inferences`, fetcher)

  return {
    mutateInferences: mutate,
    inferences: data ? data.inferences : [],
    isInferencesLoading: !error && !data,
    isInferencesError: error,
  }
}

export function useGetInference(modelId?: string, image?: string, tag?: string) {
  const { data, error, mutate } = useSWR<
    {
      inference: InferenceInterface
    },
    ErrorInfo
  >(modelId && image && tag ? `/api/v2/model/${modelId}/inference/${image}/${tag}` : null, fetcher)

  return {
    mutateInference: mutate,
    inference: data?.inference,
    isInferenceLoading: !error && !data,
    isInferenceError: error,
  }
}

export type CreateInferenceParams = Pick<InferenceInterface, 'modelId' | 'image' | 'tag' | 'settings' | 'description'>

export async function postInference(inference: CreateInferenceParams) {
  return fetch(`/api/v2/model/${inference.modelId}/inference/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inference),
  })
}

export type UpdateInferenceParams = Pick<InferenceInterface, 'settings' | 'description'>

export async function putInference(modelId: string, image: string, tag: string, inference: UpdateInferenceParams) {
  return fetch(`/api/v2/model/${modelId}/inference/${image}/${tag}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inference),
  })
}

export async function sendTokenToService(loginEndpoint: string, token: TokenInterface) {
  return fetch(loginEndpoint, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${token.accessKey}:${token.secretKey}`, 'utf8').toString('base64'),
    },
    credentials: 'include',
  })
}
