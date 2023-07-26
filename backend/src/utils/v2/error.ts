import Logger from 'bunyan'

import { BailoError } from '../../types/v2/error.js'

export function GenericError(code: number, message: string, context?: BailoError['context'], logger?: Logger) {
  const err = Error(message) as BailoError

  err.code = code
  err.context = context

  Object.defineProperty(err, 'logger', {
    value: logger,
    enumerable: false,
  })

  return err
}

export function BadReq(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(400, message, context, logger)
}

export function Forbidden(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(403, message, context, logger)
}

export function NotFound(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(404, message, context, logger)
}
