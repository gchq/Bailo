import _ from 'lodash'

export async function fetchEndpoint(url: string, method: string, data: any) {
  const headers = {
    'Content-Type': 'application/json'
  }
  if (!data) {
    headers['Content-Length'] = 0
  }
  return fetch(url, {
    method,
    body: JSON.stringify(data),
    headers
  })
}

export async function postEndpoint(url: string, data: any) {
  return fetchEndpoint(url, 'POST', data)
}

export async function putEndpoint(url: string, data?: any) {
  return fetchEndpoint(url, 'PUT', data)
}
