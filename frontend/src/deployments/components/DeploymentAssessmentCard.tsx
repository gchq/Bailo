import { Box, Card, CardContent, Typography } from '@mui/material'
import UserDisplay from 'src/common/UserDisplay'
import { DeploymentAssessmentInterface } from 'types/types'

interface DeploymentAssessmentCardProps {
  assessment: DeploymentAssessmentInterface
}

export function DeploymentAssessmentCard({ assessment }: DeploymentAssessmentCardProps) {
  const owner = assessment.owner?.[0]
  const deployer = assessment.createdBy

  return (
    <Card variant='outlined'>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography component='h3' variant='body2' sx={{ fontWeight: 600, mb: 0.5 }}>
          {assessment.name}
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {assessment.justification}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <UserDisplay key={owner} dn={owner} displayAsAvatar />
            <Typography component='span' variant='caption' color='text.secondary' sx={{ fontSize: 10 }}>
              Owner
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <UserDisplay key={deployer} dn={deployer} displayAsAvatar />
            <Typography component='span' variant='caption' color='text.secondary' sx={{ fontSize: 10 }}>
              Deployer
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
