import RemoveIcon from '@mui/icons-material/Remove'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import EmptyBlob from 'src/common/EmptyBlob'
import {
  SwimLaneAssessmentCard,
  SwimLaneAssessmentCardSkeleton,
} from 'src/deployment-assessments/components/SwimLaneAssessmentCard'
import { DeploymentAssessmentSummary } from 'types/types'

interface SwimLaneColumnProps {
  columnKey: string
  title: string
  color: string
  assessments: DeploymentAssessmentSummary[]
  isLoading: boolean
  onHide: () => void
}

export function SwimLaneColumn({ columnKey, title, color, assessments, isLoading, onHide }: SwimLaneColumnProps) {
  const skeletonCount = 1
  return (
    <Box
      data-test={`deploymentAssessmentColumn-${columnKey}`}
      sx={{
        flex: '1 1 220px',
        minWidth: 220,
        maxWidth: 600,
        bgcolor: color,
        borderRadius: 2,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component='h2' variant='caption' sx={{ fontWeight: 700, letterSpacing: 0.3, ml: 1 }}>
          {`${title} (${assessments.length})`}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={`Hide ${title} column`}>
            <IconButton size='small' onClick={onHide} sx={{ p: 0.25 }} aria-label={`Hide ${title} column`}>
              <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
        {isLoading ? (
          Array.from({ length: skeletonCount }).map((_, i) => <SwimLaneAssessmentCardSkeleton key={i} />)
        ) : (
          <>
            {assessments.map((assessment) => (
              <SwimLaneAssessmentCard key={assessment.id} assessment={assessment} />
            ))}
            {assessments.length === 0 && <EmptyBlob text='No assessments' />}
          </>
        )}
      </Box>
    </Box>
  )
}
