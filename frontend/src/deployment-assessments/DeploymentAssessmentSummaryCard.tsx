import { Box, Card, Chip, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetSchemas } from 'actions/schema'
import ChipSelector from 'src/common/ChipSelector'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import {
  DeploymentAssessmentState,
  DeploymentAssessmentStateKeys,
  DeploymentAssessmentSummary,
  SchemaKind,
} from 'types/types'
import { formatDateString } from 'utils/dateUtils'

interface DeploymentAssessmentSummaryCardProps {
  assessment: DeploymentAssessmentSummary
  returnTo?: string
  selectedModelIds: string[]
  onSelectedModelIdsChange: (modelIds: string[]) => void
}

const stateLabels: Record<DeploymentAssessmentStateKeys, string> = {
  [DeploymentAssessmentState.NEEDS_REVIEW]: 'Needs review',
  [DeploymentAssessmentState.REJECTED]: 'Rejected',
  [DeploymentAssessmentState.CHANGES_REQUESTED]: 'Changes requested',
  [DeploymentAssessmentState.APPROVED]: 'Approved',
}

function AssessmentStateChip({ assessment }: Pick<DeploymentAssessmentSummaryCardProps, 'assessment'>) {
  const theme = useTheme()

  if (assessment.draft) {
    return (
      <Chip
        label='Draft'
        size='small'
        sx={{ backgroundColor: theme.palette.info.main, color: theme.palette.info.contrastText }}
      />
    )
  }

  if (!assessment.state) {
    return <Chip label='Submitted' size='small' color='info' />
  }

  const palette = {
    [DeploymentAssessmentState.NEEDS_REVIEW]: {
      main: theme.palette.grey[400],
      contrastText: theme.palette.getContrastText(theme.palette.grey[400]),
    },
    [DeploymentAssessmentState.CHANGES_REQUESTED]: theme.palette.warning,
    [DeploymentAssessmentState.REJECTED]: theme.palette.error,
    [DeploymentAssessmentState.APPROVED]: theme.palette.success,
  }[assessment.state]

  return (
    <Chip
      label={stateLabels[assessment.state]}
      size='small'
      sx={{ backgroundColor: palette.main, color: palette.contrastText }}
    />
  )
}

export default function DeploymentAssessmentSummaryCard({
  assessment,
  returnTo,
  selectedModelIds,
  onSelectedModelIdsChange,
}: DeploymentAssessmentSummaryCardProps) {
  const { schemas } = useGetSchemas(SchemaKind.DEPLOYMENT_ASSESSMENT)
  const schemaName = schemas.find((schema) => schema.id === assessment.schemaId)?.name ?? assessment.schemaId
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
              textToCopy={assessment.id}
              notificationText='Copied deployment assessment ID to clipboard'
              ariaLabel='copy deployment assessment ID to clipboard'
            />
          </Stack>
          <AssessmentStateChip assessment={assessment} />
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
              {schemaName}
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
