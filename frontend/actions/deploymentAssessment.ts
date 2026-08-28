import { DeploymentAssessmentMetadata } from 'types/types'

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

export function patchDeploymentAssessment(
  deploymentAssessmentId: string,
  metadata?: DeploymentAssessmentMetadata,
  draft?: boolean,
  deploymentAssessmentName?: string,
) {
  return fetch(`/api/v3/deployment-assessments/${deploymentAssessmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deploymentAssessmentName,
      ...(metadata && { metadata }),
      draft,
    }),
  })
}
