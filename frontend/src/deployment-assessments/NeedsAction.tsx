import { Stack } from '@mui/material'
import SwimLaneContainer from 'src/deployment-assessments/components/SwimLaneContainer'
import { DeploymentAssessmentState } from 'types/types'

interface SwimLaneColumnConfig {
  key: string
  label: string
}

const columnConfig: SwimLaneColumnConfig[] = [
  { key: 'in_draft', label: 'In Draft' },
  { key: DeploymentAssessmentState.NeedsReview, label: 'Needs Review' },
  {
    key: DeploymentAssessmentState.ChangesRequested,
    label: 'Changes Requested',
  },
]

export default function NeedsAction() {
  return (
    <Stack spacing={1} direction='row'>
      <SwimLaneContainer
        deploymentAssessmentsFilters={{ needsAction: true }}
        columnConfig={columnConfig}
        userPreferencesKey='hiddenDeploymentAssessmentColumnsNeedsAction'
      />
    </Stack>
  )
}
