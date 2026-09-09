import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useContext, useEffect, useMemo, useState } from 'react'
import renderQueryState from 'src/common/renderQueryState'
import CurrentUserContext from 'src/contexts/currentUserContext'
import { SwimLaneColumn } from 'src/deployment-assessments/components/SwimLaneColumn'
import {
  getHiddenDeploymentAssessmentColumns,
  saveHiddenDeploymentAssessmentColumns,
} from 'src/storage/userPreferences'
import { DeploymentAssessmentState, DeploymentAssessmentSummary } from 'types/types'

interface SwimLaneColumnConfig {
  key: string
  label: string
  color: string
}

function getColumnConfig(theme: Theme): SwimLaneColumnConfig[] {
  return [
    { key: 'in_draft', label: 'In Draft', color: theme.palette.grey[200] },
    { key: DeploymentAssessmentState.NeedsReview, label: 'Needs Review', color: theme.palette.grey[200] },
    {
      key: DeploymentAssessmentState.ChangesRequested,
      label: 'Changes Requested',
      color: theme.palette.grey[200],
    },
    { key: DeploymentAssessmentState.Rejected, label: 'Rejected', color: theme.palette.grey[200] },
    { key: DeploymentAssessmentState.Approved, label: 'Approved', color: theme.palette.grey[200] },
  ]
}

function getColumnKey(assessment: DeploymentAssessmentSummary): string {
  return assessment.draft ? 'in_draft' : assessment.state
}

export default function MyAssessments() {
  const theme = useTheme()
  const currentUser = useContext(CurrentUserContext)
  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments({ createdBy: currentUser.dn })

  const [hiddenColumnKeys, setHiddenColumnKeys] = useState(getHiddenDeploymentAssessmentColumns)

  useEffect(() => {
    saveHiddenDeploymentAssessmentColumns(hiddenColumnKeys)
  }, [hiddenColumnKeys])

  const columnConfig = useMemo(() => getColumnConfig(theme), [theme])

  const columns = useMemo(() => {
    const grouped = new Map<string, DeploymentAssessmentSummary[]>(columnConfig.map((c) => [c.key, []]))
    for (const assessment of deploymentAssessments ?? []) {
      grouped.get(getColumnKey(assessment))?.push(assessment)
    }
    return columnConfig.map((column) => ({
      ...column,
      items: grouped.get(column.key) ?? [],
    }))
  }, [deploymentAssessments, columnConfig])

  const visibleColumns = columns.filter((c) => !hiddenColumnKeys.includes(c.key))
  const hiddenColumns = columns.filter((c) => hiddenColumnKeys.includes(c.key))

  const hideColumn = (key: string) => setHiddenColumnKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
  const showColumn = (key: string) => setHiddenColumnKeys((prev) => prev.filter((k) => k !== key))

  const hideEmptyColumns = () =>
    setHiddenColumnKeys((prev) => {
      const emptyKeys = columns.filter((c) => c.items.length === 0).map((c) => c.key)
      return Array.from(new Set([...prev, ...emptyKeys]))
    })

  const showAllColumns = () => setHiddenColumnKeys([])

  const hasEmptyVisibleColumns = visibleColumns.some((c) => c.items.length === 0)

  const queryState = renderQueryState([isDeploymentAssessmentsError], false)
  if (queryState) {
    return queryState
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ px: 2 }}>
      <Stack direction='row' spacing={1} sx={{ pt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button
          size='small'
          variant='contained'
          onClick={hideEmptyColumns}
          disabled={isDeploymentAssessmentsLoading || !hasEmptyVisibleColumns}
        >
          Hide empty columns
        </Button>
        <Button size='small' variant='contained' onClick={showAllColumns} disabled={hiddenColumns.length === 0}>
          Show all columns
        </Button>
      </Stack>
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
              label={`${column.label} (${column.items.length})`}
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
              color={column.color}
              assessments={column.items}
              isLoading={isDeploymentAssessmentsLoading}
              onHide={() => hideColumn(column.key)}
            />
          ))}
        </Box>
      </Box>
    </Container>
  )
}
