import { StatusError } from '../../types/interfaces'

export function BadReq(data: any, message: string) {
  const err = Error(message) as StatusError
  err.data = data
  err.code = 400
}

export function UnAuthorised(data: any, message: string) {
  const err = Error(message) as StatusError
  err.data = data
  err.code = 403
}

export function NotFound(data: any, message: string) {
  const err = Error(message) as StatusError
  err.data = data
  err.code = 404
}
