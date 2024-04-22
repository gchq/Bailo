import config from '../utils/config.js'
import { InternalError } from '../utils/error.js'

interface InferenceService {
  modelId: string
  image: string
  tag: string
  port: number
}

type CreateInferenceService = Pick<InferenceService, 'modelId' | 'image' | 'tag' | 'port'>

export async function createInferenceService(inferenceServiceParams: CreateInferenceService) {
  let res
  try {
    res = await fetch(`${config.inference.connection.host}/api/deploy`, {
      method: 'POST',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(inferenceServiceParams),
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the inferencing service.', { err })
  }
  if (!res.ok) {
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }
    throw InternalError('Unrecoginsed response returned by inferencing service.', context)
  }
}

type UpdateInferenceService = Pick<InferenceService, 'modelId' | 'image' | 'tag' | 'port'>

export async function updateInferenceService(inferenceServiceParams: UpdateInferenceService) {
  let res
  try {
    res = await fetch(`${config.inference.connection.host}/api/update`, {
      method: 'UPDATE',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(inferenceServiceParams),
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the inferencing service.', { err })
  }
  if (!res.ok) {
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }
    throw InternalError('Unrecoginsed response returned by inferencing service.', context)
  }
}

type DeleteInferenceService = Pick<InferenceService, 'modelId' | 'image' | 'tag' | 'port'>

export async function DeleteInferenceService(inferenceServiceParams: DeleteInferenceService) {
  let res
  try {
    res = await fetch(`${config.inference.connection.host}/api/delete`, {
      method: 'DELETE',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(inferenceServiceParams),
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the inferencing service.', { err })
  }
  if (!res.ok) {
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }
    throw InternalError('Unrecoginsed response returned by inferencing service.', context)
  }
}
