import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { use } from 'react'
import ThemeModeContext from 'src/contexts/themeModeContext'
import { User } from 'types/types'

type ProfileTabProps = {
  user: User
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const { theme, toggleDarkMode } = use(ThemeModeContext)
  const isDark = theme.palette.mode === 'dark'

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
      <Box sx={{ mt: 4 }}>
        <Typography
          variant='body1'
          sx={{
            fontWeight: 'bold',
          }}
        >
          Appearance
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isDark}
              onChange={toggleDarkMode}
              slotProps={{ input: { 'aria-label': 'Toggle dark mode' } }}
            />
          }
          label='Dark mode (beta)'
        />
      </Box>
    </Box>
  )
}
