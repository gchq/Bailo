import CloseIcon from '@mui/icons-material/Close'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DeploymentAssessmentCard } from 'src/deployments/components/DeploymentAssessmentCard'
import { DeploymentAssessmentInterface } from 'types/types'

interface SwimLaneColumnProps {
  title: string
  assessments: DeploymentAssessmentInterface[]
  onHide: () => void
}

export function SwimLaneColumn({ title, assessments, onHide }: SwimLaneColumnProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        flex: '1 1 220px',
        minWidth: 220,
        maxWidth: 600,
        bgcolor: theme.palette.grey[100],
        borderRadius: 2,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          component='h2'
          variant='caption'
          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label={assessments.length} size='small' sx={{ height: 20, fontSize: 11 }} />
          <Tooltip title={`Hide ${title} column`}>
            <IconButton size='small' onClick={onHide} sx={{ p: 0.25 }} aria-label={`Hide ${title} column`}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
        {assessments.map((assessment) => (
          <DeploymentAssessmentCard key={assessment.id} assessment={assessment} />
        ))}
        {assessments.length === 0 && (
          <Typography component='p' variant='caption' color='text.secondary'>
            No assessments
          </Typography>
        )}
      </Box>
    </Box>
  )
}
