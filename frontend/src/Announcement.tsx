import { Close } from '@mui/icons-material'
import CampaignIcon from '@mui/icons-material/Campaign'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
interface AnnoucementProps {
  message: string
  onClose: () => void
}

export default function Announcement({ message, onClose }: AnnoucementProps) {
  const theme = useTheme()

  const [showFullText, setShowFullText] = useState(false)

  const announcementText = useMemo(() => {
    return message.length > 100 ? (
      <Typography sx={{ wordBreak: 'break-word' }}>
        {showFullText ? message : `${message.slice(0, 100)}...`}
        <Button variant='text' size='small' onClick={() => setShowFullText(!showFullText)}>
          {showFullText ? 'Show less' : 'Show more'}
        </Button>
      </Typography>
    ) : (
      message
    )
  }, [message, showFullText])

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.info.light,
        borderBottomStyle: 'solid',
        borderWidth: 1,
        borderColor: theme.palette.primary.main,
        p: 0.5,
      }}
    >
      <Stack spacing={1} justifyContent='space-between' alignItems='center' direction='row' width='100%'>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent='center' alignItems='center'>
          <CampaignIcon color='primary' />
          <Typography color='primary' fontWeight='bold' sx={{ textAlign: 'center' }}>
            Announcement
          </Typography>
          <CampaignIcon color='primary' />
          <Box sx={{ width: '100%' }}>{announcementText}</Box>
        </Stack>
        <IconButton aria-label='close announcement pop-up' size='small' onClick={onClose}>
          <Close color='primary' />
        </IconButton>
      </Stack>
    </Box>
  )
}
