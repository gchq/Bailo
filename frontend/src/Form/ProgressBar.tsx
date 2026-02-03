import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material'

type LinearProgressWithLabelProps = LinearProgressProps & {
  value: number
  showLabel?: boolean
}

/**
 * A progress bar with optional percentage display
 * @param value the percentage complete
 * @param showLabel if true then display the percentage next to the line
 */
export function LinearProgressWithLabel({ value, showLabel = true, ...props }: LinearProgressWithLabelProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mt: 0.5,
      }}
    >
      <Box sx={{ width: '100%', mr: showLabel ? 1 : 0 }}>
        <LinearProgress variant='determinate' value={value} {...props} />
      </Box>
      {showLabel && (
        <Box sx={{ minWidth: 35 }}>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
