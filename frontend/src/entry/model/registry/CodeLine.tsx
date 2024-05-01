import CodeIcon from '@mui/icons-material/Code'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactElement } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'

interface CodeLineProps {
  line: string
  icon?: ReactElement
}

export default function CodeLine({ line, icon = <CodeIcon /> }: CodeLineProps) {
  const theme = useTheme()

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
      <CopyToClipboardButton
        textToCopy={line}
        notificationText='Copied to clipboard'
        ariaLabel='Copy text to clipboard'
      />
    </Stack>
  )
}
