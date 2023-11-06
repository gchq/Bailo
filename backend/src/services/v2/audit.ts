import { Request } from 'express'
import { IncomingMessage, ServerResponse } from 'http'

import log from './log.js'

interface Event {
  EventTime: string
  EventSource: {
    System: string
    Generator: string
    Device: {
      Hostname: string
    }
    Client: string
    User: string
  }
  EventDetail: EventDetail
}
export interface EventDetail {
  TypeId: string
  Description: string
}

const exemptions: string[] = ['u/r/l']

export async function audit(this: ServerResponse) {
  if (this.req.url && exemptions.includes(this.req.url)) {
    //Decide if the request needs auditing and whether it can be auditted
    log.info({ url: this.req.url }, 'Endpoint not required to be auditted.')
    return
  } else if (!isRequest(this.req)) {
    log.error(
      { url: this.req.url },
      'Could not audit. This should not happen and only endpoints in the exemptions list should fail to audit.',
    )
    return
  }

  //Create the event object
  const event = createEvent(this.req)

  // Process event depending on auditting system in config
  // Write to file, send to service, formatting etc
  log.info(event, 'Logging Event')
}

function createEvent(req: Request): Event {
  return {
    EventTime: new Date().toString(),
    EventSource: {
      System: 'BAILO',
      Generator: 'BAILO',
      Device: {
        Hostname: 'http://localhost:8080',
      },
      Client: req.ip,
      User: req.user,
    },
    EventDetail: req.eventDetail,
  }
}
export function isRequest(request: unknown): request is Request {
  if (typeof request !== 'object' || request === null) {
    return false
  }

  if (!(request['eventDetail'] && request['user'])) {
    return false
  }

  if (request instanceof IncomingMessage) {
    return true
  }

  return false
}
