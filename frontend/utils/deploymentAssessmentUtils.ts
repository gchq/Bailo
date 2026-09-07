import { DeploymentAssessmentState, DeploymentAssessmentSummary } from 'types/types'

export type DeploymentAssessmentStateColour = 'info' | 'warning' | 'error' | 'default'

export interface DeploymentAssessmentDisplayState {
  label: string
  colour: DeploymentAssessmentStateColour
}

export function getDeploymentAssessmentDisplayState({
  draft,
  state,
}: Pick<DeploymentAssessmentSummary, 'draft' | 'state'>): DeploymentAssessmentDisplayState {
  if (draft) {
    return { label: 'Draft', colour: 'info' }
  }

  switch (state) {
    case DeploymentAssessmentState.NEEDS_REVIEW:
      return { label: 'Awaiting review', colour: 'default' }
    case DeploymentAssessmentState.CHANGES_REQUESTED:
      return { label: 'Changes requested', colour: 'warning' }
    case DeploymentAssessmentState.REJECTED:
      return { label: 'Rejected', colour: 'error' }
    default:
      return { label: 'Approved', colour: 'default' }
  }
}

const deploymentAssessmentStatuses: Pick<DeploymentAssessmentSummary, 'draft' | 'state'>[] = [
  { draft: true },
  { draft: false, state: DeploymentAssessmentState.NEEDS_REVIEW },
  { draft: false, state: DeploymentAssessmentState.CHANGES_REQUESTED },
  { draft: false, state: DeploymentAssessmentState.REJECTED },
  { draft: false, state: DeploymentAssessmentState.APPROVED },
]

export const deploymentAssessmentStatusOrder = deploymentAssessmentStatuses.map(
  (deploymentAssessment) => getDeploymentAssessmentDisplayState(deploymentAssessment).label,
)
