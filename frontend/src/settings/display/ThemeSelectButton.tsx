import { Button, Paper, Stack } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { patchCurrentUserSettings, useGetCurrentUserSettings } from 'actions/user'
import { useContext } from 'react'
import ThemeModeContext from 'src/contexts/themeModeContext'
import useNotification from 'src/hooks/useNotification'
import ThemeSquare from 'src/settings/display/ThemeSquare'
import { themeList, ThemeMapping } from 'src/theme'

interface ExampleDisplayProps {
  theme: ThemeMapping
}
export default function ThemeSelectButton({ theme }: ExampleDisplayProps) {
  const { mutateUserSettings } = useGetCurrentUserSettings()

  const sendNotification = useNotification()
  const { setThemeKey } = useContext(ThemeModeContext)

  const displayText = () => {
    const themeListItem = themeList.find((themeListItem) => theme.key === themeListItem.key)
    return themeListItem === undefined ? theme.key : themeListItem.title
  }

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
    <ThemeProvider theme={theme.theme}>
      <Paper sx={{ border: 'solid 1px', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Button onClick={updateTheme} variant='contained' sx={{ width: '100%' }}>
            {displayText()}
          </Button>
          <Stack direction='row'>
            <ThemeSquare colour={theme.theme.palette.primary.main} />
            <ThemeSquare colour={theme.theme.palette.secondary.main} />
            <ThemeSquare colour={theme.theme.palette.text.primary} />
            <ThemeSquare colour={theme.theme.palette.container.main} />
          </Stack>
        </Stack>
      </Paper>
    </ThemeProvider>
  )
}
