import { redirectToLoginPage } from 'utils/loginUtils'

export type ErrorInfo = Error & {
  info: {
    message: string
    id?: string
    documentationUrl?: string
  }
  status: number
}

export const textFetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init)

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    if (res.status === 401) {
      redirectToLoginPage()
    }
    const error: ErrorInfo = {
      ...new Error('An error occurred while fetching the data.'),
      info: (await res.json()).error,
      status: res.status,
    }
    throw error
  }

  return res.text()
}

export const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init)

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    if (res.status === 401) {
      redirectToLoginPage()
    }
    const error: ErrorInfo = {
      ...new Error('An error occurred while fetching the data.'),
      info: await res.json(),
      status: res.status,
    }
    throw error
  }

  return res.json()
}

export const getErrorMessage = async (res: Response) => {
  let messageError = res.statusText
  try {
    messageError = `${res.statusText}: ${(await res.json()).error.message}`
  } catch (e) {
    // unable to identify error message, possibly a network failure
  }

  return messageError
}
