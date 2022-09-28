export async function fetchEndpoint(url: string, method: string, data: unknown) {
  return fetch(url, {
    method,
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function postEndpoint(url: string, data: unknown) {
  return fetchEndpoint(url, 'POST', data)
}

export async function putEndpoint(url: string, data: unknown) {
  return fetchEndpoint(url, 'PUT', data)
}
