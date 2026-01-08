import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material'
import { FormStats, ModelFormStats } from 'utils/formUtils'

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant='determinate' {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  )
}

type OverallCompletionStatsProps = {
  stats: ModelFormStats
}

export function OverallCompletionStats({ stats }: OverallCompletionStatsProps) {
  return (
    <Box>
      <Box>
        Pages Completed: {stats.pagesCompleted}/{stats.totalPages}
      </Box>
      <LinearProgressWithLabel value={stats.percentagePagesComplete} />
    </Box>
  )
}

type FormCompletionStatsProps = {
  stats: FormStats
}

export function FormCompletionStats({ stats }: FormCompletionStatsProps) {
  // console.log(`FormCompletionStats: ${JSON.stringify(stats)}`)
  return (
    <Box>
      <Box>
        Completed: {stats.totalAnswers}/{stats.totalQuestions}
      </Box>
      <LinearProgressWithLabel value={stats.percentageQuestionsComplete} />
    </Box>
  )
}
