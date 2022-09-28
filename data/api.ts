export async function fetchEndpoint(url: string, method: string, data?: unknown) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(data != null && { body: JSON.stringify(data) }),
  })
}

export async function postEndpoint(url: string, data: unknown) {
  return fetchEndpoint(url, 'POST', data)
}

export async function putEndpoint(url: string, data: unknown) {
  return fetchEndpoint(url, 'PUT', data)
}

export async function deleteEndpoint(url: string) {
  return fetchEndpoint(url, 'DELETE')
}
