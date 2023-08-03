import axios, { AxiosError } from 'axios'

export function handleAxiosError(error: AxiosError | unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return { status: error.response.status, data: `${error.response.status}: ${error.response.statusText}` }
    } else if (error.request) {
      return { status: 503, data: 'No response receieved from server' }
    } else {
      return { data: `There was a problem with this request. ${error}` }
    }
  } else {
    return { data: 'Could not format response error: ' }
  }
}
