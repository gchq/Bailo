import { NextFunction, Request, Response } from 'express'
import { isNativeError } from 'util/types'

import audit from '../../connectors/audit/index.js'
import log from '../../services/log.js'
import { BailoError } from '../../types/error.js'
import { InternalError } from '../../utils/error.js'

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

export async function expressErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  if (bailoErrorGuard(err)) {
    const logger = err.logger || req.log
    if (err.context) {
      logger.warn(err.context, err.message)
    } else {
      logger.warn(err.message)
    }

    delete err.context?.internal

    await audit.onError(req, err)

    res.status(err.code).json({
      error: {
        name: err.name,
        message: err.message,
        context: err.context,
      },
    })
    return
  } else if (isNativeError(err)) {
    log.warn(
      { err: { name: err.name, stack: err.stack } },
      'Generic Javascript error found, returning generic error to user.',
    )
    await audit.onError(req, InternalError('Internal Server Error'))
    res.status(500).json({
      error: {
        name: 'Internal Server Error',
        message: 'Unknown error - Please contact Bailo support',
      },
    })
    return
  }
  log.error({ err }, 'Unknown error format was found, returning generic error to user.')
  throw err
}
