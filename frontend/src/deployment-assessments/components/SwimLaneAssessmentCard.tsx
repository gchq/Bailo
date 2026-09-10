import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { DeploymentAssessmentSummary } from 'types/types'

interface SwimLaneAssessmentCardProps {
  assessment: DeploymentAssessmentSummary
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        minWidth: 0,
      }}
    >
      <Typography component='span' variant='caption' color='text.secondary' sx={{ fontWeight: 'bold', flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, overflow: 'hidden', textAlign: 'right' }}>{children}</Box>
    </Box>
  )
}

function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <InfoRow label={label}>
      <Typography variant='caption' noWrap sx={{ display: 'block' }}>
        {value || '—'}
      </Typography>
    </InfoRow>
  )
}

function UserRow({ label, dn }: { label: string; dn: string }) {
  return (
    <InfoRow label={label}>
      <UserDisplay dn={dn} />
    </InfoRow>
  )
}

export function SwimLaneAssessmentCard({ assessment }: SwimLaneAssessmentCardProps) {
  const riskOwners = assessment.owner?.join(', ') ?? ''
  const deployer = assessment.createdBy
  const models = assessment.models?.join(', ') ?? ''
  const returnTo = '/deployment-assessments?tab=my-assessments'

  return (
    <Card variant='outlined' sx={{ minHeight: 120 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Link
          href={{
            pathname: `/deployment-assessments/${assessment.id}`,
            query: { returnTo },
          }}
          sx={{ overflow: 'hidden' }}
        >
          <Typography component='h3' variant='body1' color='primary' noWrap>
            {assessment.name}
          </Typography>
        </Link>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
          <TextRow label='Models' value={models} />
          <UserRow label='Risk Owner' dn={riskOwners} />
          <UserRow label='Deployer' dn={deployer} />
        </Box>
      </CardContent>
    </Card>
  )
}

export function SwimLaneAssessmentCardSkeleton() {
  return (
    <Card variant='outlined' sx={{ minHeight: 140 }} aria-hidden>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Skeleton variant='text' width='75%' sx={{ fontSize: (theme) => theme.typography.body1.fontSize }} />
        <Box sx={{ mt: 1, mb: 1 }}>
          <Skeleton variant='text' width='40%' sx={{ fontSize: (theme) => theme.typography.body2.fontSize }} />
          <Skeleton variant='text' width='100%' sx={{ fontSize: (theme) => theme.typography.body2.fontSize }} />
          <Skeleton variant='text' width='90%' sx={{ fontSize: (theme) => theme.typography.body2.fontSize }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {[
            { labelWidth: 45, valueWidth: 90 },
            { labelWidth: 60, valueWidth: 75 },
            { labelWidth: 55, valueWidth: 80 },
          ].map((row, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Skeleton
                variant='text'
                width={row.labelWidth}
                sx={{ fontSize: (theme) => theme.typography.caption.fontSize }}
              />
              <Skeleton
                variant='text'
                width={row.valueWidth}
                sx={{ fontSize: (theme) => theme.typography.caption.fontSize }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
