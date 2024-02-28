import { NextFunction, Request, Response } from 'express'

import audit from '../../connectors/audit/index.js'
import log from '../../services/log.js'
import { BailoError } from '../../types/error.js'

export function bailoErrorGuard(err: unknown): err is BailoError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (!('code' in err) || typeof err.code !== 'number') {
    return false
  }

  if (err.code < 100 || err.code >= 600) {
    return false
  }

  // Internal and context are both unknown, so they could be any value.
  // Thus, we don't check them here.

  return true
}

export async function expressErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (!bailoErrorGuard(err)) {
    log.error({ err }, 'No error code was found, returning generic error to user.')
    throw err
  }

  const logger = err.logger || req.log
  logger.warn(err.context, err.message)

  delete err.context?.internal

  await audit.onError(req, err)

  return res.status(err.code).json({
    error: {
      name: err.name,
      message: err.message,
      context: err.context,
    },
  })
}
