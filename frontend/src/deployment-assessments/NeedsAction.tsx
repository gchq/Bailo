import { Stack } from '@mui/material'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useState } from 'react'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import DeploymentAssessmentSummaryCard from 'src/deployment-assessments/DeploymentAssessmentSummaryCard'
import { DeploymentAssessmentStatusKeys, statusToApiFilters } from 'src/hooks/useDeploymentAssessmentFilters'
import { DeploymentAssessmentSummary } from 'types/types'

export default function NeedsAction() {
  const [selectedStatus, setSelectedStatus] = useState<DeploymentAssessmentStatusKeys>()

  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments({ needsAction: true, ...statusToApiFilters(selectedStatus) })

  const renderDeploymentAssessment = ({ data }: { data: DeploymentAssessmentSummary & { key: string } }) => (
    <DeploymentAssessmentSummaryCard
      assessment={data}
      returnTo='/deployment-assessments?tab=needs-action'
      selectedState={selectedStatus}
      onSelectedStateChange={(state) => setSelectedStatus(state)}
    />
  )

  const queryState = renderQueryState([isDeploymentAssessmentsError], isDeploymentAssessmentsLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Stack spacing={1}>
      <Paginate
        list={deploymentAssessments.map((deploymentAssessment) => ({
          key: deploymentAssessment.id,
          ...deploymentAssessment,
        }))}
        emptyListText={'No deployment assessments need your action'}
        sortingProperties={[
          { value: 'createdAt', title: 'Date created', iconKind: 'date' },
          { value: 'name', title: 'Name', iconKind: 'text' },
        ]}
        defaultSortProperty='createdAt'
        searchFilterProperty='name'
        searchPlaceholderText='Search by name'
      >
        {renderDeploymentAssessment}
      </Paginate>
    </Stack>
  )
}
