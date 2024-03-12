import { Box, Button } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { patchCurrentUserSettings, useGetCurrentUserSettings } from 'actions/user'
import { useContext } from 'react'
import ThemeModeContext from 'src/contexts/themeModeContext'
import useNotification from 'src/hooks/useNotification'
import { ThemeMapping } from 'src/theme'

interface ExampleDisplayProps {
  theme: ThemeMapping
}
export default function ExampleDisplay({ theme }: ExampleDisplayProps) {
  const { mutateUserSettings } = useGetCurrentUserSettings()

  const sendNotification = useNotification()
  const { setThemeKey } = useContext(ThemeModeContext)

  async function updateTheme() {
    const updatedSettings = await patchCurrentUserSettings({ themeKey: theme.key })
    if (updatedSettings.status === 200) {
      mutateUserSettings()
      const data = await updatedSettings.json()
      setThemeKey(data.settings.themeKey)
    } else {
      sendNotification({
        variant: 'error',
        msg: 'Could not update appliction them',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: theme.theme.palette.primary.main,
          backgroundColor: theme.theme.palette.background.default,
        }}
      >
        <Button sx={{ color: theme.theme.palette.primary.main, width: '100%' }} onClick={updateTheme}>
          {theme.key}
        </Button>
      </Box>
    </ThemeProvider>
  )
}
