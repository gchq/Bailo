import { Button } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { patchCurrentUserSettings, useGetCurrentUserSettings } from 'actions/user'
import { useContext } from 'react'
import ThemeModeContext from 'src/contexts/themeModeContext'
import useNotification from 'src/hooks/useNotification'
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
    <ThemeProvider theme={theme}>
      <Button variant='outlined' sx={{ width: '200px' }} onClick={updateTheme}>
        {displayText()}
      </Button>
    </ThemeProvider>
  )
}
