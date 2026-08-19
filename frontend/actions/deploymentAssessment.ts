export function postDeploymentAssessment(schemaId: string, form: Record<string, unknown>, draft: boolean) {
  return fetch(`/api/v3/deployment-assessments`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: { ...form }, schemaId, draft }),
  })
}
