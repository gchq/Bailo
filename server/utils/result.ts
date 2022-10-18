import { StatusError } from '../../types/interfaces'

export function GenericError(data: any, message: string, code: number, logger?: any) {
  const err = Error(message) as StatusError & { logger: any }
  err.data = data
  err.code = code

  Object.defineProperty(err, 'logger', {
    value: logger,
    enumerable: false,
  })

  return err
}

export function BadReq(data: any, message: string, logger?: any) {
  return GenericError(data, message, 400, logger)
}

export function Unauthorised(data: any, message: string, logger?: any) {
  return GenericError(data, message, 401, logger)
}

export function Forbidden(data: any, message: string, logger?: any) {
  return GenericError(data, message, 403, logger)
}

export function NotFound(data: any, message: string, logger?: any) {
  return GenericError(data, message, 404, logger)
}

export function Conflict(data: any, message: string, logger?: any) {
  return GenericError(data, message, 409, logger)
}

export function NotImplemented(data: any, message: string, logger?: any) {
  return GenericError(data, message, 501, logger)
}
