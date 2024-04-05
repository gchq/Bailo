import Logger from 'bunyan'

import { RegistryErrorResponse } from '../clients/registry.js'
import { BailoError } from '../types/error.js'
import { RegistryError } from '../types/RegistryError.js'

export function GenericError(code: number, message: string, context?: BailoError['context'], logger?: Logger) {
  const err = Error(message) as BailoError

  err.name = 'Bailo Error'

  if (err.stack) {
    // Remove this file from stack traces.
    err.stack = err.stack
      .split('\n')
      .filter((line) => !line.includes('backend/src/utils/v2/error.ts'))
      .join('\n')
  }

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

export function Unauthorized(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(401, message, context, logger)
}

export function Forbidden(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(403, message, context, logger)
}

export function NotFound(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(404, message, context, logger)
}

export function ContentTooLarge(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(413, message, context, logger)
}

export function InternalError(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(500, message, context, logger)
}

export function ConfigurationError(message: string, context?: BailoError['context'], logger?: Logger) {
  return GenericError(503, `BAILO configuration error: ${message}`, context, logger)
}

export function RegistryError(error: RegistryErrorResponse, context: BailoError['context']) {
  const registryError = GenericError(500, `Error response received from registry.`, {
    errors: error.errors,
    ...context,
  }) as RegistryError
  registryError.name = 'Registry Error'
  registryError.errors = error.errors

  return registryError
}
