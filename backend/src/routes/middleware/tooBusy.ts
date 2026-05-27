import toobusy from 'toobusy-js'

import log from '../../services/log.js'

export function tooBusy(req, res, next) {
  if (toobusy()) {
    log.warn('Server response time too long, preventing more requests from being handled.')
    res.status(503).send('Server Too Busy')
  } else {
    next()
  }
}
