import { NextFunction, Request, Response } from 'express'

import { audit } from '../../services/v2/audit.js'
//import log from '../../services/v2/log.js'
//import config from '../../utils/v2/config.js'

export async function attachAuditService(req: Request, res: Response, next: NextFunction) {
  //if (config.logging.stroom.enabled) {
  res.on('finish', audit)
  //} else {
  //  log.info('Audit logging disabled.')
  //}
  return next()
}
