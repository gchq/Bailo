import Logger from 'bunyan'

export interface StatusError {
  code: number
  message: string
  data: any
  logger?: Logger
}
