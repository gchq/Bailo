export function postAccessRequest(modelId: string, schemaId: string, form: any) {
  return fetch(`/api/v2/model/${modelId}/access-requests`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: { ...form }, schemaId: schemaId }),
  })
}
