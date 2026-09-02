import { Stack } from '@mui/material'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import DeploymentAssessmentItem from 'src/deployment-assessments/DeploymentAssessmentItem'
import { DeploymentAssessmentSummary } from 'types/types'
import { deploymentAssessmentStatusOrder, getDeploymentAssessmentDisplayState } from 'utils/deploymentAssessmentUtils'

type PaginatedDeploymentAssessment = DeploymentAssessmentSummary & { key: string }

export default function NeedsAction() {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments({ needsAction: true })

  const statusOptions = useMemo(() => {
    const presentStatuses = new Set(
      deploymentAssessments.map(
        (deploymentAssessment) => getDeploymentAssessmentDisplayState(deploymentAssessment).label,
      ),
    )
    return deploymentAssessmentStatusOrder.filter((status) => presentStatuses.has(status))
  }, [deploymentAssessments])

  useEffect(() => {
    setSelectedStatuses((statuses) => {
      const availableStatuses = statuses.filter((status) => statusOptions.includes(status))
      return availableStatuses.length === statuses.length ? statuses : availableStatuses
    })
  }, [statusOptions])

  const filteredDeploymentAssessments = useMemo(
    () =>
      deploymentAssessments.filter(
        (deploymentAssessment) =>
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(getDeploymentAssessmentDisplayState(deploymentAssessment).label),
      ),
    [deploymentAssessments, selectedStatuses],
  )

  // Stable identity, so Paginate's memoised list is not rebuilt on every render
  const renderDeploymentAssessment = useCallback(
    ({ data }: { data: PaginatedDeploymentAssessment }) => <DeploymentAssessmentItem deploymentAssessment={data} />,
    [],
  )

  const queryState = renderQueryState([isDeploymentAssessmentsError], isDeploymentAssessmentsLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Stack spacing={1}>
      {statusOptions.length > 1 && (
        <div>
          <ChipSelector
            label='Status'
            multiple
            options={statusOptions}
            selectedChips={selectedStatuses}
            onChange={setSelectedStatuses}
            size='small'
            chipTooltipTitle={(status) => `Filter by status: ${status}`}
          />
        </div>
      )}
      <Paginate
        list={filteredDeploymentAssessments.map((deploymentAssessment) => ({
          key: deploymentAssessment.id,
          ...deploymentAssessment,
        }))}
        emptyListText={
          selectedStatuses.length > 0
            ? 'No deployment assessments match the selected statuses'
            : 'No deployment assessments need your action'
        }
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
