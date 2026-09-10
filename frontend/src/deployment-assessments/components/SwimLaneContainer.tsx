import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DeploymentAssessmentFilters, useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import renderQueryState from 'src/common/renderQueryState'
import { SwimLaneColumn } from 'src/deployment-assessments/components/SwimLaneColumn'
import {
  getHiddenDeploymentAssessmentColumns,
  saveHiddenDeploymentAssessmentColumns,
} from 'src/storage/userPreferences'
import { DeploymentAssessmentSummary } from 'types/types'

interface SwimLaneColumnConfig {
  key: string
  label: string
}

type SwimLaneContainerProps = {
  deploymentAssessmentsFilters: DeploymentAssessmentFilters
  columnConfig: SwimLaneColumnConfig[]
  userPreferencesKey: string
}

function getColumnKey(assessment: DeploymentAssessmentSummary): string {
  return assessment.draft ? 'in_draft' : assessment.state
}

export default function SwimLaneContainer({
  deploymentAssessmentsFilters,
  columnConfig,
  userPreferencesKey,
}: SwimLaneContainerProps) {
  const theme = useTheme()

  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments(deploymentAssessmentsFilters)

  const [hiddenColumnKeys, setHiddenColumnKeys] = useState(getHiddenDeploymentAssessmentColumns(userPreferencesKey))
  const [contentWidth, setContentWidth] = useState(0)

  const topScrollRef = useRef<HTMLDivElement>(null)
  const bottomScrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveHiddenDeploymentAssessmentColumns(userPreferencesKey, hiddenColumnKeys)
  }, [hiddenColumnKeys, userPreferencesKey])

  useEffect(() => {
    if (!contentRef.current) {
      return
    }
    const observer = new ResizeObserver(() => {
      setContentWidth(contentRef.current?.scrollWidth ?? 0)
    })
    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [])

  const handleTopScroll = useCallback(() => {
    if (bottomScrollRef.current && topScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }, [])

  const handleBottomScroll = useCallback(() => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft
    }
  }, [])

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
      <Box ref={topScrollRef} sx={{ overflowX: 'auto', pt: 2 }} onScroll={handleTopScroll}>
        <Box sx={{ height: '1px', width: contentWidth }} aria-hidden />
      </Box>
      <Box ref={bottomScrollRef} sx={{ overflowX: 'auto', py: 1 }} onScroll={handleBottomScroll}>
        <Box
          ref={contentRef}
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
              color={theme.palette.grey[200]}
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
