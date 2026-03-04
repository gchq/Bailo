import fetch from 'node-fetch'
import { gzip } from 'pako'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { GenericError } from '../utils/error.js'

export async function sendEvents(events: string) {
  const res = await fetch(config.stroom.url, {
    method: 'POST',
    body: Buffer.from((await gzip(events)).buffer),
    headers: {
      Compression: 'gzip',
      Feed: config.stroom.feed,
    },
    agent: await getHttpsAgent({ rejectUnauthorized: false }),
  })

  if (!res.ok) {
    throw GenericError(res.status, 'Failed to send logs to STROOM - Non-200 response', {
      res,
      body: await res.body,
    })
  }

  const responseBody = await res.body
  log.info({ url: config.stroom.url, body: responseBody }, 'Successfully sent batch of events to STROOM.')
  return responseBody
}
