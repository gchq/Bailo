import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Button, ButtonGroup, Stack } from 'node_modules/@mui/material/index.mjs'
import { use } from 'react'
import ThemeModeContext from 'src/contexts/themeModeContext'
import { User } from 'types/types'

type ProfileTabProps = {
  user: User
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const { toggleDarkMode } = use(ThemeModeContext)
  const systemIsDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')

  const handleSystemThemeOnClick = () => {
    if (systemIsDarkMode) {
      toggleDarkMode(systemIsDarkMode.matches)
    }
  }

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography
        sx={{
          fontWeight: 'bold',
        }}
      >
        Name
      </Typography>
      <Typography>{user.dn}</Typography>
      <Stack sx={{ mt: 4 }} spacing={1}>
        <Typography
          variant='body1'
          sx={{
            fontWeight: 'bold',
          }}
        >
          Theme
        </Typography>
        <Typography variant='caption'>
          Disclaimer: Dark mode is currently in development, and full accessibility cannot be guaranteed. Use at your
          own discretion.
        </Typography>
        <ButtonGroup variant='outlined'>
          <Button onClick={() => toggleDarkMode(false)}>Light</Button>
          <Button onClick={() => toggleDarkMode(true)}>Dark (beta)</Button>
          <Button onClick={handleSystemThemeOnClick}>System</Button>
        </ButtonGroup>
      </Stack>
    </Box>
  )
}
