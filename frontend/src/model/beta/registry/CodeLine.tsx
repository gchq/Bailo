import CodeIcon from '@mui/icons-material/Code'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactElement } from 'react'
import useNotification from 'src/common/Snackbar'

interface CodeLineProps {
  line: string
  icon?: ReactElement
}

export default function CodeLine({ line, icon = <CodeIcon /> }: CodeLineProps) {
  const theme = useTheme()
  const sendNotification = useNotification()

  function handleButtonClick() {
    navigator.clipboard.writeText(line)
    sendNotification({ variant: 'success', msg: 'Copied to clipboard' })
  }

  return (
    <Tooltip title='Copy to clipboard' arrow>
      <Box
        sx={{ backgroundColor: theme.palette.container.main, p: 1, borderRadius: 2, cursor: 'pointer' }}
        component='div'
        role='button'
        tabIndex={0}
        onClick={() => {
          handleButtonClick()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Spacebar' || e.key === ' ') {
            handleButtonClick()
          }
        }}
      >
        <Stack direction='row' spacing={2} alignItems='center'>
          {icon}
          <Typography>{line}</Typography>
        </Stack>
      </Box>
    </Tooltip>
  )
}
