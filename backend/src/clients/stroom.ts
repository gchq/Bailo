import { PassThrough, Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import zlib from 'node:zlib'

import fetch from 'node-fetch'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { GenericError, toBailoError } from '../utils/error.js'

export async function sendEvents(events: Readable) {
  const controller = new AbortController()
  const passThrough = new PassThrough()
  let pipelineError: unknown
  const pipelinePromise = pipeline(events, zlib.createGzip(), passThrough).catch((err) => {
    pipelineError = err
    log.error({ err }, 'Failed to compress events for STROOM.')
    // abort safely causes `fetch` to reject
    controller.abort()
  })
  const res = await fetch(config.stroom.url, {
    method: 'POST',
    body: passThrough,
    signal: controller.signal,
    headers: {
      ...config.stroom.headers,
    },
    agent: getHttpsAgent({ rejectUnauthorized: config.stroom.rejectUnauthorized }),
  })

  // This will ensure any error thrown by pipeline(...).catch(...) is handled in the main thread
  // Any error/failure thrown will also abort the fetch signal
  await pipelinePromise
  if (pipelineError) {
    throw toBailoError(pipelineError)
  }

  if (!res.ok) {
    throw GenericError(res.status, 'Failed to send logs to STROOM - Non-200 response', {
      res,
      body: await res.text(),
    })
  }

  const responseBody = await res.text()
  log.info({ url: config.stroom.url, body: responseBody }, 'Successfully sent batch of events to STROOM.')
  return responseBody
}
