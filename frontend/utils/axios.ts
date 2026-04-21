import axios, { AxiosError } from 'axios'

export function handleAxiosError(error: AxiosError | unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const serverMessage =
        typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data?.error?.message || JSON.stringify(error.response.data)

      return {
        status: error.response.status,
        data: `${error.response.statusText}: ${serverMessage}`,
      }
    } else if (error.request) {
      // The request was made but no response was received
      return { status: 503, data: 'No response received from server' }
    } else {
      // Something happened in setting up the request that triggered an Error
      return { data: `There was a problem with this request. ${error}` }
    }
  } else {
    return { data: 'Unknown error' }
  }
}
