import { Close } from '@mui/icons-material'
import CampaignIcon from '@mui/icons-material/Campaign'
import { Box, Button, Grid2, IconButton, Stack, Typography } from '@mui/material'
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
      <Stack>
        <Typography>
          {showFullText ? message : `${message.slice(0, 100)}...`}
          <Button variant='text' size='small' onClick={() => setShowFullText(!showFullText)}>
            {showFullText ? 'Show less' : 'Show more'}
          </Button>
        </Typography>
      </Stack>
    ) : (
      message
    )
  }, [message, showFullText])

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.info.light,
        p: 1,
        position: 'absolute',
        bottom: 0,
        mb: 4,
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: theme.palette.primary.main,
        borderRadius: 1,
        left: 0,
        right: 0,
        maxWidth: 'md',
        mx: 'auto',
      }}
    >
      <Stack spacing={1} alignItems='center'>
        <Grid2 container justifyContent='space-between' alignItems='center'>
          <Grid2 size={{ xs: 1 }} />
          <Grid2 size={{ xs: 10 }} sx={{ textAlign: 'center' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: '100%' }}
              justifyContent='center'
              alignItems='center'
            >
              <CampaignIcon color='primary' />
              <Typography color='primary' fontWeight='bold' sx={{ textAlign: 'center' }}>
                Announcement
              </Typography>
              <CampaignIcon color='primary' />
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 1 }} sx={{ textAlign: 'right' }}>
            <IconButton size='small' onClick={onClose}>
              <Close color='primary' />
            </IconButton>
          </Grid2>
        </Grid2>
        {announcementText}
      </Stack>
    </Box>
  )
}
