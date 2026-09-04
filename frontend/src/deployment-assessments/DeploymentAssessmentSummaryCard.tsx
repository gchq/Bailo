import { Box, Card, Stack, Typography } from '@mui/material'
import { useGetSchema } from 'actions/schema'
import ChipSelector from 'src/common/ChipSelector'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import UserDisplay from 'src/common/UserDisplay'
import AssessmentStateChip from 'src/deployment-assessments/AssessmentStateChip'
import { DeploymentAssessmentStatusKeys } from 'src/hooks/useDeploymentAssessmentFilters'
import Link from 'src/Link'
import { DeploymentAssessmentSummary } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

interface DeploymentAssessmentSummaryCardProps {
  assessment: DeploymentAssessmentSummary
  returnTo?: string

  selectedModelIds?: string[]
  onSelectedModelIdsChange?: (modelIds: string[]) => void

  selectedState?: DeploymentAssessmentStatusKeys
  onSelectedStateChange?: (state?: DeploymentAssessmentStatusKeys) => void
}

export default function DeploymentAssessmentSummaryCard({
  assessment,
  returnTo,
  selectedModelIds,
  onSelectedModelIdsChange,
  selectedState,
  onSelectedStateChange,
}: DeploymentAssessmentSummaryCardProps) {
  const { schema } = useGetSchema(assessment.schemaId)

  const canSelectModels = selectedModelIds !== undefined && onSelectedModelIdsChange !== undefined

  const owners = assessment.owner ? (Array.isArray(assessment.owner) ? assessment.owner : [assessment.owner]) : []

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Link
              href={{
                pathname: `/deployment-assessments/${assessment.id}`,
                query: returnTo ? { returnTo } : undefined,
              }}
              sx={{ overflow: 'hidden' }}
            >
              <Typography component='h2' variant='h6' color='primary' noWrap>
                {assessment.name}
              </Typography>
            </Link>
            <CopyToClipboardButton
              textToCopy={assessment.name}
              notificationText='Copied deployment assessment name to clipboard'
              ariaLabel='copy deployment assessment name to clipboard'
            />
          </Stack>
          <AssessmentStateChip
            assessment={assessment}
            selectedState={selectedState}
            onSelectedStateChange={onSelectedStateChange}
          />
        </Stack>
        <Stack direction='row'>
          <Typography variant='caption'>
            Created by {<UserDisplay dn={assessment.createdBy} />} on
            <Typography
              variant='caption'
              sx={{
                fontWeight: 'bold',
              }}
            >
              {` ${formatDateString(assessment.createdAt)} `}
            </Typography>
          </Typography>
        </Stack>
        <Card variant='outlined' sx={{ height: '100%', p: 2 }}>
          <Typography component='h3' variant='subtitle2' sx={{ mb: 1 }}>
            <Box component='span' sx={{ fontWeight: 'bold' }}>
              Models:
            </Box>{' '}
            {assessment.models?.length ? (
              canSelectModels ? (
                <ChipSelector
                  chipTooltipTitle='Filter by model'
                  options={assessment.models}
                  multiple
                  selectedChips={selectedModelIds}
                  onChange={onSelectedModelIdsChange}
                  size='small'
                  variant='outlined'
                  ariaLabel='add model to deployment assessment filters'
                  style={{ maxWidth: '400px' }}
                />
              ) : (
                <Typography component='span' variant='body2'>
                  {assessment.models.join(', ')}
                </Typography>
              )
            ) : (
              <Typography variant='body2' component='em'>
                No models specified
              </Typography>
            )}
          </Typography>
          <Stack spacing={1}>
            <Typography variant='body2'>
              <Box component='span' sx={{ fontWeight: 'bold' }}>
                Schema:
              </Box>{' '}
              {schema?.name ?? assessment.schemaId}
            </Typography>
            <Typography variant='body2' component='div'>
              <Box component='span' sx={{ fontWeight: 'bold' }}>
                Risk owner:
              </Box>{' '}
              {owners.length ? (
                <Stack component='span' direction='row' spacing={1} sx={{ display: 'inline-flex', flexWrap: 'wrap' }}>
                  {owners.map((owner) => (
                    <UserDisplay key={owner} dn={owner} />
                  ))}
                </Stack>
              ) : (
                <em>Not specified</em>
              )}
            </Typography>
            <Typography variant='body2'>
              <Box component='span' sx={{ fontWeight: 'bold' }}>
                Justification:
              </Box>{' '}
              {assessment.justification}
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </Box>
  )
}
