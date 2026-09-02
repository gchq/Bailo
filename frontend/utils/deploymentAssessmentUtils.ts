import { DeploymentAssessmentState, DeploymentAssessmentSummary } from 'types/types'

export type DeploymentAssessmentStateColour = 'info' | 'warning' | 'error' | 'default'

export interface DeploymentAssessmentDisplayState {
  label: string
  colour: DeploymentAssessmentStateColour
}

export const deploymentAssessmentStatusOrder = ['Draft', 'Awaiting review', 'Changes requested', 'Rejected', 'Approved']

export function getDeploymentAssessmentDisplayState({
  draft,
  state,
}: Pick<DeploymentAssessmentSummary, 'draft' | 'state'>): DeploymentAssessmentDisplayState {
  if (draft) {
    return { label: 'Draft', colour: 'info' }
  }

  switch (state) {
    case DeploymentAssessmentState.NeedsReview:
      return { label: 'Awaiting review', colour: 'default' }
    case DeploymentAssessmentState.ChangesRequested:
      return { label: 'Changes requested', colour: 'warning' }
    case DeploymentAssessmentState.Rejected:
      return { label: 'Rejected', colour: 'error' }
    default:
      return { label: 'Approved', colour: 'default' }
  }
}
