export function postDeploymentAssessment(
  name: string,
  schemaId: string,
  form: Record<string, unknown>,
  draft: boolean,
) {
  return fetch(`/api/v3/deployment-assessments`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      schemaId,
      ...(form && { metadata: { ...form } }),
      draft,
    }),
  })
}
