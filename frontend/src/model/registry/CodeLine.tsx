import { ContentCopy } from '@mui/icons-material'
import CodeIcon from '@mui/icons-material/Code'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactElement } from 'react'
import useNotification from 'src/hooks/useNotification'

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
    <Stack direction='row' spacing={1}>
      <Box
        sx={{ backgroundColor: theme.palette.container.main, p: 1, borderRadius: 2, width: '100%' }}
        component='div'
        role='button'
        tabIndex={0}
      >
        <Stack direction='row' spacing={2} alignItems='center'>
          {icon}
          <Typography>{line}</Typography>
        </Stack>
      </Box>
      <Tooltip title='Copy to clipboard' arrow>
        <IconButton color='primary' onClick={() => handleButtonClick()} aria-label='Copy text to clipboard'>
          <ContentCopy />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
