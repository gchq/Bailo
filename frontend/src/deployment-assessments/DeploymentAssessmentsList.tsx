import ExpandMore from '@mui/icons-material/ExpandMore'
import RestartAlt from '@mui/icons-material/RestartAlt'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DeploymentAssessmentFilters, useGetDeploymentAssessments } from 'actions/deploymentAssessments'
import { useGetSchemas } from 'actions/schema'
import { useEffect, useState } from 'react'
import CreatedDateRangeFilter from 'src/common/CreatedDateRangeFilter'
import DeploymentModelFilter from 'src/common/DeploymentModelFilter'
import { dnToEntity } from 'src/common/EntityAutocomplete'
import EntityAutocompleteFilter from 'src/common/EntityAutocompleteFilter'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import useDebounce from 'src/hooks/useDebounce'
import {
  buildDeploymentAssessmentListHref,
  DeploymentAssessmentStatus,
  DeploymentAssessmentStatusKeys,
  statusToApiFilters,
  useDeploymentAssessmentFilters,
} from 'src/hooks/useDeploymentAssessmentFilters'
import MessageAlert from 'src/MessageAlert'
import { DeploymentAssessmentState, DeploymentAssessmentSummary, SchemaKind } from 'types/types'

import DeploymentAssessmentSummaryCard from './DeploymentAssessmentSummaryCard'

const statusLabels: Record<DeploymentAssessmentStatusKeys, string> = {
  [DeploymentAssessmentStatus.DRAFT]: 'Draft',
  [DeploymentAssessmentState.NEEDS_REVIEW]: 'Needs review',
  [DeploymentAssessmentState.CHANGES_REQUESTED]: 'Changes requested',
  [DeploymentAssessmentState.APPROVED]: 'Approved',
  [DeploymentAssessmentState.REJECTED]: 'Rejected',
}

export default function DeploymentAssessmentsList() {
  const { filters, setFilters, resetFilters } = useDeploymentAssessmentFilters()
  const [search, setSearch] = useState(filters.search ?? '')
  const debouncedSearch = useDebounce(search.trim(), 300)
  useEffect(() => setSearch(filters.search ?? ''), [filters.search])
  useEffect(() => {
    setFilters({ search: debouncedSearch || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])
  const creationWindowError = Boolean(
    filters.createdAfter && filters.createdBefore && filters.createdAfter > filters.createdBefore,
  )
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.DEPLOYMENT_ASSESSMENT)
  const apiFilters: DeploymentAssessmentFilters = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...statusToApiFilters(filters.status),
    ...(filters.modelIds.length > 0 && { modelIds: filters.modelIds }),
    ...(filters.riskOwner && { riskOwner: filters.riskOwner }),
    ...(filters.createdBy && { createdBy: filters.createdBy }),
    ...(filters.schemaId && { schemaId: filters.schemaId }),
    ...(filters.createdAfter && { createdAfter: filters.createdAfter }),
    ...(filters.createdBefore && { createdBefore: filters.createdBefore }),
  }
  const { deploymentAssessments, isDeploymentAssessmentsLoading, isDeploymentAssessmentsError } =
    useGetDeploymentAssessments(apiFilters, !creationWindowError)

  const activeFilterCount =
    Number(Boolean(search)) +
    Number(Boolean(filters.status)) +
    filters.modelIds.length +
    Number(Boolean(filters.riskOwner)) +
    Number(Boolean(filters.createdBy)) +
    Number(Boolean(filters.schemaId)) +
    Number(Boolean(filters.createdAfter)) +
    Number(Boolean(filters.createdBefore))
  const list = deploymentAssessments.map((assessment) => ({ ...assessment, key: assessment.id }))
  const returnTo = buildDeploymentAssessmentListHref(filters)

  return (
    <Stack spacing={2}>
      <Stack spacing={2}>
        <Stack direction='row' spacing={1} useFlexGap sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            label='Search assessments'
            size='small'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
          />
          <TextField
            select
            size='small'
            label='Status'
            value={filters.status ?? ''}
            onChange={(event) => setFilters({ status: event.target.value as DeploymentAssessmentStatusKeys })}
            sx={{ width: 190 }}
          >
            <MenuItem value=''>
              <em>All</em>
            </MenuItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <Stack spacing={0.5} sx={{ width: { xs: '100%', sm: 340 } }}>
            <DeploymentModelFilter
              selectedModelIds={filters.modelIds}
              onChange={(modelIds) => setFilters({ modelIds })}
            />
          </Stack>
          <Box sx={{ width: { xs: '100%', sm: 280 } }}>
            {/* TODO: Add a user only property to the following component. Enforce options based on this */}
            <EntityAutocompleteFilter
              label='Risk owner'
              value={filters.riskOwner}
              onChange={(riskOwner) => setFilters({ riskOwner })}
            />
          </Box>
          <Button
            onClick={resetFilters}
            startIcon={<RestartAlt />}
            disabled={activeFilterCount === 0}
            sx={{ mt: 0.25 }}
          >
            Reset filters
          </Button>
        </Stack>
        <Accordion disableGutters elevation={0} sx={{ '&::before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
            <Typography sx={{ fontWeight: 'bold' }}>Advanced filters</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0 }}>
            <Stack direction='row' spacing={2} useFlexGap sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                select
                label='Schema'
                size='small'
                value={filters.schemaId ?? ''}
                disabled={isSchemasLoading}
                onChange={(event) => setFilters({ schemaId: event.target.value || undefined })}
                sx={{ width: { xs: '100%', sm: 220 } }}
              >
                <MenuItem value=''>
                  <em>All</em>
                </MenuItem>
                {schemas.map((schema) => (
                  <MenuItem key={schema.id} value={schema.id}>
                    {schema.name}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ width: { xs: '100%', sm: 260 } }}>
                {/* TODO: Add a user only property to the following component. Enforce options based on this */}
                <EntityAutocompleteFilter
                  label='Created by'
                  value={filters.createdBy && `user:${filters.createdBy}`}

                  onChange={(createdBy) => setFilters({ createdBy: createdBy && dnToEntity(createdBy).id })}
                />
              </Box>
              <CreatedDateRangeFilter
                createdAfter={filters.createdAfter}
                createdBefore={filters.createdBefore}
                onCreatedAfterChange={(createdAfter) => setFilters({ createdAfter })}
                onCreatedBeforeChange={(createdBefore) => setFilters({ createdBefore })}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
      <Divider />
      <Typography variant='body2' color='text.secondary'>
        {deploymentAssessments.length} assessment{deploymentAssessments.length === 1 ? '' : 's'} found
      </Typography>
      {isSchemasError && <MessageAlert message={isSchemasError.info.message} severity='error' />}
      {isDeploymentAssessmentsError && (
        <MessageAlert message={isDeploymentAssessmentsError.info.message} severity='error' />
      )}
      {isDeploymentAssessmentsLoading && deploymentAssessments.length === 0 && <Loading />}
      {!isDeploymentAssessmentsError &&
        !creationWindowError &&
        (!isDeploymentAssessmentsLoading || list.length > 0) && (
          <Paginate
            list={list}
            emptyListText='No deployment assessments found'
            sortingProperties={[
              { value: 'name', title: 'Name', iconKind: 'text' },
              { value: 'createdAt', title: 'Created date', iconKind: 'date' },
            ]}
            searchFilterProperty='name'
            hideSearchInput
            defaultSortProperty='createdAt'
          >
            {({ data }: { data: DeploymentAssessmentSummary & { key: string } }) => (
              <DeploymentAssessmentSummaryCard
                assessment={data}
                returnTo={returnTo}
                selectedModelIds={filters.modelIds}
                onSelectedModelIdsChange={(modelIds) => setFilters({ modelIds })}
                selectedState={filters.status}
                onSelectedStateChange={(status) => setFilters({ status })}
              />
            )}
          </Paginate>
        )}
    </Stack>
  )
}
