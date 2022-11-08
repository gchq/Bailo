import axios, { Method } from 'axios'

export async function fetchEndpoint(url: string, method?: Method, data?: unknown) {
  return axios({
    method,
    url,
    headers: {
      ...(!data && data !== 0 && { 'Content-Length': '0' }),
      'Content-Type': 'application/json',
    },
    data,
  })
}

export async function postEndpoint(url: string, data: unknown) {
  return fetchEndpoint(url, 'POST', data)
}

export async function putEndpoint(url: string, data?: unknown) {
  return fetchEndpoint(url, 'PUT', data)
}
