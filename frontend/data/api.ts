import { redirectToLoginPage } from 'utils/loginUtils'

export async function fetchEndpoint(url: string, method: string, data?: unknown, headers?: unknown) {
  const apiHeaders = headers
    ? (headers as HeadersInit)
    : {
        ...(!data && data !== 0 && { 'Content-Length': '0' }),
        'Content-Type': 'application/json',
      }
  const response = await fetch(url, {
    method,
    headers: apiHeaders,
    ...(data !== undefined && { body: JSON.stringify(data) }),
  })

  if (response.status === 401) {
    redirectToLoginPage()
  }

  return response
}

export async function getEndpoint(url: string, headers?: unknown) {
  return fetchEndpoint(url, 'GET', null, headers)
}

export async function postEndpoint(url: string, data: unknown, headers?: unknown) {
  return fetchEndpoint(url, 'POST', data, headers)
}

export async function putEndpoint(url: string, data?: unknown, headers?: unknown) {
  return fetchEndpoint(url, 'PUT', data, headers)
}

export async function deleteEndpoint(url: string, headers?: unknown) {
  return fetchEndpoint(url, 'DELETE', null, headers)
}
