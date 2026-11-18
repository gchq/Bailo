import CampaignIcon from '@mui/icons-material/Campaign'
import Close from '@mui/icons-material/Close'
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined'
import OpenInNew from '@mui/icons-material/OpenInNew'
import WarningAmber from '@mui/icons-material/WarningAmber'
import { Box, Button, IconButton, Paper, Stack, Typography } from '@mui/material'
import { alpha, darken, lighten, useTheme } from '@mui/material/styles'
import { useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import { type UiConfig } from 'types/types'

type AnnouncementSeverity = NonNullable<UiConfig['announcement']['severity']>

const severityIcons = {
  info: CampaignIcon,
  warning: WarningAmber,
  error: ErrorOutline,
}

function isExternalLink(href: string) {
  try {
    // Relative links resolve against the current page, so they count as the same host
    return new URL(href, window.location.href).host !== window.location.host
  } catch {
    return true
  }
}

interface AnnouncementProps {
  title?: string
  message: string
  /** Markdown shown when the user selects "Show more" */
  description?: string
  severity?: AnnouncementSeverity
  links?: UiConfig['announcement']['links']
  onClose: () => void
}

export default function Announcement({
  title,
  message,
  description,
  severity = 'info',
  links = [],
  onClose,
}: AnnouncementProps) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const colour = theme.palette[severity].main
  // main shades fall below 4.5:1 on the tinted background (e.g. light info 3.3:1), a 0.3 shift passes in every case
  const accent = theme.palette.mode === 'dark' ? lighten(colour, 0.3) : darken(colour, 0.3)
  const Icon = severityIcons[severity]

  return (
    <Paper
      elevation={6}
      role={severity === 'info' ? 'status' : 'alert'}
      sx={{
        // Tint layered over the paper colour so the banner stays opaque over the page content
        backgroundImage: `linear-gradient(${alpha(colour, 0.12)}, ${alpha(colour, 0.12)})`,
        borderLeft: `6px solid ${colour}`,
        borderRadius: 2,
        px: 2,
        py: 1.5,
      }}
    >
      <Stack spacing={1}>
        <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
          <Icon sx={{ color: accent }} />
          <Typography component='h2' sx={{ fontWeight: 'bold', flexGrow: 1, wordBreak: 'break-word' }}>
            {title || 'Announcement'}
          </Typography>
          <IconButton aria-label='close announcement pop-up' size='small' onClick={onClose}>
            <Close sx={{ color: accent }} />
          </IconButton>
        </Stack>
        <Typography sx={{ wordBreak: 'break-word' }}>{message}</Typography>
        {description && (
          <>
            {expanded && (
              <Box id='announcement-description'>
                <MarkdownDisplay>{description}</MarkdownDisplay>
              </Box>
            )}
            <Box>
              <Button
                size='small'
                color={severity}
                aria-expanded={expanded}
                aria-controls='announcement-description'
                onClick={() => setExpanded(!expanded)}
                sx={{ color: accent }}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            </Box>
          </>
        )}
        {links.length > 0 && (
          <Stack direction='row' useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
            {links.map((link) => {
              const external = isExternalLink(link.href)
              return (
                <Button
                  key={link.href}
                  href={link.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  variant='contained'
                  size='small'
                  color={severity}
                  disableElevation
                  endIcon={external ? <OpenInNew /> : undefined}
                  // main shades (e.g. info #0288d1) fall below 4.5:1 text contrast, dark shades all pass
                  sx={{
                    whiteSpace: 'nowrap',
                    backgroundColor: theme.palette[severity].dark,
                    color: theme.palette.getContrastText(theme.palette[severity].dark),
                  }}
                >
                  {link.label}
                </Button>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
