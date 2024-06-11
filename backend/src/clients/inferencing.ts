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
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(inferenceServiceParams),
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the inferencing service.', { err })
  }
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the inferencing service.')
  }
  // TODO - Update return object. For now, we are just checking the status
  return res.json()
}

export async function updateInferenceService(inferenceServiceParams: InferenceService) {
  let res
  try {
    res = await fetch(`${config.inference.connection.host}/api/update`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(inferenceServiceParams),
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the inferencing service.', { err })
  }

  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the inferencing service.')
  }
  // TODO - Update return object. For now, we are just checking the status
  return res.json()
}
