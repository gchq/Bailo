import { StatusError } from "../../types/interfaces"

export function BadReq(data: any, message: string) {
  const err = Error(message) as StatusError
  err.data = data
  err.code = 400
}