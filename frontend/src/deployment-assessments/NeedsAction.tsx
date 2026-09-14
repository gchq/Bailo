import SwimLaneContainer from 'src/deployment-assessments/components/SwimLaneContainer'
import { DeploymentAssessmentState } from 'types/types'

interface SwimLaneColumnConfig {
  key: string
  label: string
}

const columnConfig: SwimLaneColumnConfig[] = [
  { key: 'in_draft', label: 'Publish Draft' },
  { key: DeploymentAssessmentState.NeedsReview, label: 'Needs Review' },
  {
    key: DeploymentAssessmentState.ChangesRequested,
    label: 'Changes Requested',
  },
  { key: DeploymentAssessmentState.Rejected, label: 'Rejected' },
]

export default function NeedsAction() {
  return (
    <SwimLaneContainer
      deploymentAssessmentsFilters={{ needsAction: true }}
      columnConfig={columnConfig}
      userPreferencesKey='hiddenDeploymentAssessmentColumnsNeedsAction'
    />
  )
}
