import axios from 'axios'
import { isSuccessResponse } from './apiUtils'

type ErrorInfo = Error & { info: unknown; status: number }

export const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await axios(input, init)

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (isSuccessResponse(res)) {
    const error: ErrorInfo = {
      ...new Error('An error occurred while fetching the data.'),
      info: await res.data,
      status: res.status,
    }
    throw error
  }

  return res.data
}

export const getErrorMessage = async (res: Response) => {
  let messageError = res.statusText
  try {
    messageError = `${res.statusText}: ${(await res.json()).message}`
  } catch (e) {
    // unable to identify error message, possibly a network failure
  }

  return messageError
}
