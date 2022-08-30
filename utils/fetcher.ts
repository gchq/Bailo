type ErrorInfo = Error & { info: any; status: number }

export const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init)

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as ErrorInfo
    // Attach extra info to the error object.
    error.info = await res.json()
    error.status = res.status
    throw error
  }

  return res.json()
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
