import Logger from 'bunyan'

export interface BailoError extends Error {
  // Inherited from 'Error'
  // name: string
  // message: string

  // An HTTP response code that represents the error
  code: number

  // This data is logged publicly to the frontend
  context?: {
    documentationUrl?: string

    // Items in internal are not displayed to the user and may include sensitive information
    internal?: unknown

    [key: string]: unknown
  }

  // A custom logger may be provided, otherwise a default is used
  logger?: Logger
}

export function isBailoError(err: unknown): err is BailoError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (err instanceof Error && err.name === 'Bailo Error') {
    return true
  }

  return false
}
