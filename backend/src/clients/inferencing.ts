import fetch from 'node-fetch'

import config from '../utils/config.js'
import { BadReq, InternalError } from '../utils/error.js'

interface InferenceService {
  modelId: string
  image: string
  tag: string
  port: number
}

export async function createInferenceService(inferenceServiceParams: InferenceService) {
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
  const body = await res.json()
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the inferencing service.')
  }

  return body
}

export async function updateInferenceService(inferenceServiceParams: InferenceService) {
  let res
  try {
    res = await fetch(`${config.inference.connection.host}/api/update`, {
      method: 'PATCH',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(inferenceServiceParams),
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the inferencing service.', { err })
  }
  const body = await res.json()
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the inferencing service.')
  }

  return body
}
