import zlib from 'node:zlib'

import fetch from 'node-fetch'
import { Readable } from 'stream'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { GenericError } from '../utils/error.js'

export async function sendEvents(events: string) {
  const sourceStream = Readable.from(events)
  const gzipStream = zlib.createGzip()
  const bodyStream = sourceStream.pipe(gzipStream)

  const res = await fetch(config.stroom.url, {
    method: 'POST',
    body: bodyStream,
    headers: {
      Compression: 'gzip',
      Feed: config.stroom.feed,
    },
    agent: getHttpsAgent({ rejectUnauthorized: false }),
  })

  if (!res.ok) {
    throw GenericError(res.status, 'Failed to send logs to STROOM - Non-200 response', {
      res,
      body: res.body,
    })
  }

  const responseBody = await res.body
  log.info({ url: config.stroom.url, body: responseBody }, 'Successfully sent batch of events to STROOM.')
  return responseBody
}
