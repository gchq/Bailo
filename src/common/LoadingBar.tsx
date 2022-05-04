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
  return (
    <>
      {showLoadingBar && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant='determinate' value={loadingPercentage} sx={{ mt: 4, mb: 2, p: 1 }} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant='body2' color='text.secondary'>{`${Math.round(loadingPercentage)}%`}</Typography>
          </Box>
        </Box>
      )}
    </>
  )
}
