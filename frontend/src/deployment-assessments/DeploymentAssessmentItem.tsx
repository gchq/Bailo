import { Chip, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import { DeploymentAssessmentSummary } from 'types/types'
import { formatDateStringAsDayMonthAndYear, timeDifference } from 'utils/dateUtils'
import { getDeploymentAssessmentDisplayState } from 'utils/deploymentAssessmentUtils'

type DeploymentAssessmentItemProps = {
  deploymentAssessment: DeploymentAssessmentSummary
}

export default function DeploymentAssessmentItem({ deploymentAssessment }: DeploymentAssessmentItemProps) {
  const displayState = useMemo(() => getDeploymentAssessmentDisplayState(deploymentAssessment), [deploymentAssessment])

  return (
    // Apply border to list item so button's hover border style doesn't resize/shift content
    <ListItem
      disablePadding
      sx={(theme) => ({
        borderLeft: '6px solid',
        borderLeftColor:
          displayState.colour === 'default' ? theme.palette.divider : theme.palette[displayState.colour].main,
      })}
    >
      <ListItemButton
        component={Link}
        href={`/deployment-assessments/${deploymentAssessment.id}`}
        aria-label={`View deployment assessment ${deploymentAssessment.name}`}
        // Hover style adds right border so stop it shifting
        sx={{ borderRight: '2px solid transparent' }}
      >
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Stack
            direction='row'
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}
          >
            <Typography sx={{ wordBreak: 'break-all', fontWeight: 'bold' }} color='primary' variant='h6' component='h2'>
              {deploymentAssessment.name}
            </Typography>
            <Chip
              label={displayState.label}
              size='small'
              variant='outlined'
              color={displayState.colour}
              data-test='deploymentAssessmentStateChip'
            />
          </Stack>
          {deploymentAssessment.justification && (
            <Typography
              sx={{
                // Styles with vendor prefixes may not support all browsers. Use with caution
                display: '-webkit-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}
            >
              {deploymentAssessment.justification}
            </Typography>
          )}
          {deploymentAssessment.owner && deploymentAssessment.owner.length > 0 && (
            <Stack>
              <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                Risk owner
              </Typography>
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                {deploymentAssessment.owner.map((owner) => (
                  <UserDisplay key={owner} dn={owner} highlightCurrentUser />
                ))}
              </Stack>
            </Stack>
          )}
          <Stack>
            <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
              Created by
            </Typography>
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <UserDisplay dn={deploymentAssessment.createdBy} displayAsAvatar highlightCurrentUser />
            </Stack>
          </Stack>
          {deploymentAssessment.reviewedAt && (
            <Stack>
              <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                Review date
              </Typography>
              <Typography>{formatDateStringAsDayMonthAndYear(deploymentAssessment.reviewedAt)}</Typography>
            </Stack>
          )}
          <Typography variant='caption'>{`Created ${timeDifference(
            new Date(),
            new Date(deploymentAssessment.createdAt),
          )}.`}</Typography>
        </Stack>
      </ListItemButton>
    </ListItem>
  )
}
