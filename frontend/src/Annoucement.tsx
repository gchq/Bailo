import { Close } from '@mui/icons-material'
import CampaignIcon from '@mui/icons-material/Campaign'
import { Box, Button, Grid, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
interface AnnoucementProps {
  message: string
  onClose: () => void
}

export default function Announcement({ message, onClose }: AnnoucementProps) {
  const theme = useTheme()

  const [showFullText, setShowFullText] = useState(false)

  const announcementText = () => {
    return message.length > 100 ? (
      <Stack>
        <Typography>
          {!showFullText ? `${message.slice(0, 100)}...` : message}
          <span>
            <Button variant='text' size='small' onClick={() => setShowFullText(!showFullText)}>
              {showFullText ? 'Show less' : 'Show more'}
            </Button>
          </span>
        </Typography>
      </Stack>
    ) : (
      message
    )
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme.palette.info.light,
          p: 1,
          position: 'absolute',
          bottom: 0,
          m: 4,
          borderStyle: 'solid',
          borderWidth: 2,
          borderColor: theme.palette.primary.main,
          borderRadius: 1,
        }}
      >
        <Stack spacing={1}>
          <Grid container justifyContent='space-between' alignItems='center'>
            <Grid item xs={1} />
            <Grid item xs={10} sx={{ textAlign: 'center' }}>
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
            </Grid>
            <Grid item xs={1} sx={{ textAlign: 'right' }}>
              <IconButton size='small' onClick={onClose}>
                <Close color='primary' />
              </IconButton>
            </Grid>
          </Grid>
          <Typography color='primary' sx={{ textAlign: 'center' }}>
            {announcementText()}
          </Typography>
        </Stack>
      </Box>
    </>
  )
}
