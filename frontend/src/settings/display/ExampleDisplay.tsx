import { Box, Button } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { patchCurrentUserSettings, useGetCurrentUserSettings } from 'actions/user'
import { ThemeKey } from 'src/theme'

interface ExampleDisplayProps {
  theme: ThemeKey
}
export default function ExampleDisplay({ theme }: ExampleDisplayProps) {
  const { mutateUserSettings } = useGetCurrentUserSettings()

  async function setTheme() {
    const updatedSettings = await patchCurrentUserSettings({ theme: theme.key })
    if (updatedSettings.status === 200) {
      mutateUserSettings()
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
        <Button sx={{ color: theme.theme.palette.primary.main, width: '100%' }} onClick={setTheme}>
          {theme.key}
        </Button>
      </Box>
    </ThemeProvider>
  )
}
