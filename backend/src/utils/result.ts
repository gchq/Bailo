import Logger from 'bunyan'

type ErrorDetails =
  | string
  | {
      message: string
      id?: string
      documentationUrl?: string
    }

export interface BailoError extends Error {
  data: any
  code: number
  id?: string
  documentationUrl?: string
  logger: any
}

export function GenericError(data: unknown, details: ErrorDetails, code: number, logger?: Logger) {
  const message = typeof details === 'string' ? details : details.message

  const err = Error(message) as BailoError
  err.data = data
  err.code = code

  if (typeof details !== 'string') {
    err.id = details.id
    err.documentationUrl = details.documentationUrl
  }

  Object.defineProperty(err, 'logger', {
    value: logger,
    enumerable: false,
  })

  return err
}

export function BadReq(data: unknown, details: ErrorDetails, logger?: Logger) {
  return GenericError(data, details, 400, logger)
}

export function Unauthorised(data: unknown, details: ErrorDetails, logger?: Logger) {
  return GenericError(data, details, 401, logger)
}

export function Forbidden(data: unknown, details: ErrorDetails, logger?: Logger) {
  return GenericError(data, details, 403, logger)
}

export function NotFound(data: unknown, details: ErrorDetails, logger?: Logger) {
  return GenericError(data, details, 404, logger)
}

export function Conflict(data: unknown, details: ErrorDetails, logger?: Logger) {
  return GenericError(data, details, 409, logger)
}

export function NotImplemented(data: unknown, details: ErrorDetails, logger?: Logger) {
  return GenericError(data, details, 501, logger)
}
