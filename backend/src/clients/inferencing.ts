import fetch from 'node-fetch'

import config from '../utils/config.js'
import { BadReq, InternalError, Unauthorized } from '../utils/error.js'

interface InferenceService {
  modelId: string
  image: string
  tag: string
  port: number
}

export async function createInferenceService(inferenceServiceParams: InferenceService) {
  let res
  try {
    const authorisationToken = config.inference.authorisationToken

    if (!authorisationToken) {
      throw Unauthorized('No authentication key exists')
    }
    res = await fetch(`${config.ui.inference.connection.host}/api/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${authorisationToken}` },
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
    const authorisationToken = config.inference.authorisationToken

    if (!authorisationToken) {
      throw Unauthorized('No authentication key exists')
    }

    res = await fetch(`${config.ui.inference.connection.host}/api/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${authorisationToken}` },
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
