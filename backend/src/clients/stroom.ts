import { PassThrough, Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import zlib from 'node:zlib'

import fetch from 'node-fetch'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { GenericError } from '../utils/error.js'

export async function sendEvents(events: string) {
  const controller = new AbortController()
  const passThrough = new PassThrough()
  const pipelinePromise = pipeline(Readable.from(events), zlib.createGzip(), passThrough).catch((err) => {
    controller.abort()
    throw err
  })
  const res = await fetch(config.stroom.url, {
    method: 'POST',
    body: passThrough,
    signal: controller.signal,
    headers: {
      'Content-Encoding': 'gzip',
      Feed: config.stroom.feed,
    },
    agent: getHttpsAgent({ rejectUnauthorized: config.stroom.rejectUnauthorized }),
  })

  await pipelinePromise

  if (!res.ok) {
    throw GenericError(res.status, 'Failed to send logs to STROOM - Non-200 response', {
      res,
      body: res.body,
    })
  }

  const responseBody = res.body
  log.info({ url: config.stroom.url, body: responseBody }, 'Successfully sent batch of events to STROOM.')
  return responseBody
}
