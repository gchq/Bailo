import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

export default function LoadingBar({
  showLoadingBar,
  loadingPercentage,
}: {
  showLoadingBar: boolean
  loadingPercentage: number
}) {
  if (!showLoadingBar) {
    return null
  }

  return (
    <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant='determinate' value={loadingPercentage} sx={{ p: 1 }} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant='body2' color='text.secondary'>{`${Math.round(loadingPercentage)}%`}</Typography>
      </Box>
    </Box>
  )
}
