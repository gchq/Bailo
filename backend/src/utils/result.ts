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

export function GenericError(data: any, details: ErrorDetails, code: number, logger?: any) {
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

export function BadReq(data: any, details: ErrorDetails, logger?: any) {
  return GenericError(data, details, 400, logger)
}

export function Unauthorised(data: any, details: ErrorDetails, logger?: any) {
  return GenericError(data, details, 401, logger)
}

export function Forbidden(data: any, details: ErrorDetails, logger?: any) {
  return GenericError(data, details, 403, logger)
}

export function NotFound(data: any, details: ErrorDetails, logger?: any) {
  return GenericError(data, details, 404, logger)
}

export function Conflict(data: any, details: ErrorDetails, logger?: any) {
  return GenericError(data, details, 409, logger)
}

export function NotImplemented(data: any, details: ErrorDetails, logger?: any) {
  return GenericError(data, details, 501, logger)
}
