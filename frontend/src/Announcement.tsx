import { Close } from '@mui/icons-material'
import CampaignIcon from '@mui/icons-material/Campaign'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandableTypography from 'src/common/ExpandableTypography'
interface AnnoucementProps {
  message: string
  onClose: () => void
}

export default function Announcement({ message, onClose }: AnnoucementProps) {
  const theme = useTheme()

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
          <Box sx={{ width: '100%' }}>
            <ExpandableTypography sx={{ wordBreak: 'break-word' }}>{message}</ExpandableTypography>
          </Box>
        </Stack>
        <IconButton aria-label='close announcement pop-up' size='small' onClick={onClose}>
          <Close color='primary' />
        </IconButton>
      </Stack>
    </Box>
  )
}
