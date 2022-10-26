import ContentCopy from '@mui/icons-material/ContentCopy'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import React, { useState } from 'react'

function SettingsProfileTab({ user }: { user: any }) {
  const [displayToken, setDisplayToken] = useState(false)
  const [displayedToken, setDisplayedToken] = useState('')

  const theme = useTheme()

  const regenerateToken = async () => {
    const { token } = await fetch('/api/v1/user/token', {
      method: 'POST',
    }).then((res) => res.json())

    return token
  }

  const showToken = async () => {
    const token = await regenerateToken()
    setDisplayedToken(token)
    setDisplayToken(true)
  }

  return (
    <>
      <Box sx={{ pt: 0, pr: 2, pb: 2, pl: 2 }}>
        <Typography variant='body1' sx={{ pr: 1, fontWeight: 'medium' }}>
          Name
        </Typography>
        <Divider sx={{ pt: 1, mb: 1 }} />
        <Typography variant='body1'>{user.id}</Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant='body1' sx={{ pr: 1, fontWeight: 'medium' }}>
          Roles
        </Typography>
        <Divider sx={{ pt: 1, mb: 1 }} />
        <Stack direction='row' sx={{ p: 1 }}>
          {user.roles.map((role: any) => (
            <Chip
              color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
              sx={{ backgroundColor: theme.palette.mode === 'light' ? 'primary' : 'secondary' }}
              key={`chip-role-${role}`}
              label={role}
            />
          ))}
        </Stack>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant='body1' sx={{ pr: 1, fontWeight: 'medium' }}>
          User authentication token
        </Typography>
        <Divider sx={{ pt: 1, mb: 2 }} />
        <Stack direction='row'>
          <Button sx={{ mr: 2 }} variant='outlined' onClick={showToken} data-test='showTokenButton'>
            Regenerate Token
          </Button>
          <Box
            sx={{
              backgroundColor: theme.palette.mode === 'light' ? '#f3f1f1' : '#5a5a5a',
              pr: 2,
              pl: 2,
              display: 'flex',
              mr: 1,
            }}
          >
            <Box component={Stack} direction='column' justifyContent='center'>
              <Typography variant='body1' data-test='dockerPassword'>
                {displayToken ? displayedToken : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx'}
              </Typography>
            </Box>
          </Box>
          <Tooltip title='Regenerate & Copy to clipboard'>
            <IconButton
              onClick={async () => {
                const token = await regenerateToken()
                setDisplayedToken(token)
                navigator.clipboard.writeText(token)
              }}
              aria-label='regenerate and copy to clipboard'
            >
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </>
  )
}

export default SettingsProfileTab
