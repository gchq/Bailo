import { Stack } from '@mui/material'
import { useContext } from 'react'
import CurrentUserContext from 'src/contexts/currentUserContext'
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
  { key: DeploymentAssessmentState.Rejected, label: 'Rejected' },
  { key: DeploymentAssessmentState.Approved, label: 'Approved' },
]

export default function MyAssessments() {
  const currentUser = useContext(CurrentUserContext)

  return (
    <Stack spacing={1} direction='row'>
      <SwimLaneContainer
        deploymentAssessmentsFilters={{ createdBy: currentUser.dn }}
        columnConfig={columnConfig}
        userPreferencesKey='hiddenDeploymentAssessmentColumnsMyAssessments'
      />
    </Stack>
  )
}
