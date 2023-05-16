import { redirectToLoginPage } from 'utils/loginUtils'

export async function fetchEndpoint(url: string, method: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(!data && data !== 0 && { 'Content-Length': '0' }),
      'Content-Type': 'application/json',
    },
    ...(data !== undefined && { body: JSON.stringify(data) }),
  })

  if (response.status === 401) {
    redirectToLoginPage()
  }

  return response
}

export async function getEndpoint(url: string) {
  return fetchEndpoint(url, 'GET')
}

export async function postEndpoint(url: string, data: unknown) {
  return fetchEndpoint(url, 'POST', data)
}

export async function putEndpoint(url: string, data?: unknown) {
  return fetchEndpoint(url, 'PUT', data)
}

export async function deleteEndpoint(url: string) {
  return fetchEndpoint(url, 'DELETE')
}
