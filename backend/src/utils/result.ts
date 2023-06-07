import Logger from 'bunyan'

import { StatusError } from '../types/types.js'

export function GenericError(data: unknown, message: string, code: number, logger?: Logger) {
  const err = Error(message) as StatusError & { logger: any }
  err.data = data
  err.code = code

  Object.defineProperty(err, 'logger', {
    value: logger,
    enumerable: false,
  })

  return err
}

export function BadReq(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 400, logger)
}

export function Unauthorised(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 401, logger)
}

export function Forbidden(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 403, logger)
}

export function NotFound(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 404, logger)
}

export function Conflict(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 409, logger)
}

export function InternalServer(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 500, logger)
}

export function NotImplemented(data: unknown, message: string, logger?: Logger) {
  return GenericError(data, message, 501, logger)
}
