import { redirectToLoginPage } from 'utils/loginUtils'

export type ErrorInfo = Error & {
  info: {
    message: string
    id?: string
    documentationUrl?: string
  }
  status: number
}

type ErrorResponse = {
  error: Error
}

export const textFetcher = async (path: any) => {
  const res = await fetch(path)

  if (!res.ok) {
    await handleSWRError(res)
  }

  return res.text()
}

export const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    await handleSWRError(res)
  }

  return res.json()
}

export const getErrorMessage = async (res: Response) => {
  const body = await res.json()

  return getErrorMessageFromBody(body, res.statusText)
}

const handleSWRError = async (res: Response) => {
  if (res.status === 401) {
    redirectToLoginPage()
  }

  let error: ErrorInfo
  try {
    const body = await res.json()
    error = {
      ...new Error('An error occurred while fetching the data.'),
      info: {
        ...body,
        message: getErrorMessageFromBody(body, res.statusText),
      },
      status: res.status,
    }
  } catch (e) {
    error = {
      ...new Error('An error occurred while fetching the data.'),
      info: {
        message: res.statusText,
      },
      status: res.status,
    }
  }

  throw error
}

const isErrorResponse = (value: unknown): value is ErrorResponse => {
  return !!(value && (value as ErrorResponse).error && (value as ErrorResponse).error.message)
}

const getErrorMessageFromBody = (body: unknown, statusText: string) => {
  if (isErrorResponse(body)) {
    return `${statusText}: ${body.error.message}`
  }

  // unable to identify error message, possibly a network failure
  return 'Unknown error - Please contact Bailo support'
}
