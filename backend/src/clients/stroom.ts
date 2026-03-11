import { PassThrough, Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import zlib from 'node:zlib'

import fetch from 'node-fetch'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { GenericError } from '../utils/error.js'

export async function sendEvents(events: string) {
  const passThrough = new PassThrough()
  pipeline(Readable.from(events), zlib.createGzip(), passThrough).catch((err) => {
    log.error(err, 'Stroom sendEvents gzip pipeline failed')
  })

  const res = await fetch(config.stroom.url, {
    method: 'POST',
    body: passThrough,
    headers: {
      Compression: 'gzip',
      Feed: config.stroom.feed,
    },
    agent: getHttpsAgent({ rejectUnauthorized: config.stroom.rejectUnauthorized }),
  })

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
