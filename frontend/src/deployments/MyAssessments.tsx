import { Box, Chip, Container, Typography } from '@mui/material'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useEffect, useMemo, useState } from 'react'
import renderQueryState from 'src/common/renderQueryState'
import { SwimLaneColumn } from 'src/deployments/components/SwimLaneColumn'
import {
  getHiddenDeploymentAssessmentColumns,
  saveHiddenDeploymentAssessmentColumns,
} from 'src/storage/userPreferences'
import { DeploymentAssessmentInterface, DeploymentStates } from 'types/types'

const COLUMNS = [
  { key: 'in_draft', label: 'In Draft' },
  { key: DeploymentStates.NeedsReview, label: 'Needs Review' },
  { key: DeploymentStates.ChangesRequested, label: 'Changes Requested' },
  { key: DeploymentStates.Rejected, label: 'Rejected' },
  { key: DeploymentStates.Approved, label: 'Approved' },
]

function getColumnKey(assessment: DeploymentAssessmentInterface): string {
  return assessment.draft ? 'in_draft' : assessment.state
}

export default function MyAssessments() {
  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments({})

  const [hiddenColumnKeys, setHiddenColumnKeys] = useState(getHiddenDeploymentAssessmentColumns)

  useEffect(() => {
    saveHiddenDeploymentAssessmentColumns(hiddenColumnKeys)
  }, [hiddenColumnKeys])

  const columns = useMemo(() => {
    const grouped = new Map<string, DeploymentAssessmentInterface[]>(COLUMNS.map((column) => [column.key, []]))
    for (const assessment of deploymentAssessments ?? []) {
      grouped.get(getColumnKey(assessment))?.push(assessment)
    }

    return COLUMNS.map((column) => ({
      ...column,
      items: grouped.get(column.key) ?? [],
    }))
  }, [deploymentAssessments])

  const visibleColumns = columns.filter((c) => !hiddenColumnKeys.includes(c.key))
  const hiddenColumns = columns.filter((c) => hiddenColumnKeys.includes(c.key))

  const hideColumn = (key: string) => setHiddenColumnKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
  const showColumn = (key: string) => setHiddenColumnKeys((prev) => prev.filter((k) => k !== key))

  const queryState = renderQueryState([isDeploymentAssessmentsError], isDeploymentAssessmentsLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ px: 2 }}>
      {hiddenColumns.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            pt: 2,
          }}
        >
          <Typography variant='caption' color='text.secondary'>
            Hidden columns:
          </Typography>
          {hiddenColumns.map((column) => (
            <Chip
              key={column.key}
              label={column.label}
              size='small'
              variant='outlined'
              onDelete={() => showColumn(column.key)}
            />
          ))}
        </Box>
      )}
      <Box sx={{ overflowX: 'auto', py: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            width: '100%',
          }}
        >
          {visibleColumns.map((column) => (
            <SwimLaneColumn
              key={column.key}
              title={column.label}
              assessments={column.items}
              onHide={() => hideColumn(column.key)}
            />
          ))}
        </Box>
      </Box>
    </Container>
  )
}
