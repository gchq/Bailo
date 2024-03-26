import { Theme, ThemeProvider } from '@mui/material/styles'
import { ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import ThemeModeContext from 'src/contexts/themeModeContext'
import { lightTheme, themeList } from 'src/theme'
import { getUserSettings } from 'utils/userSettingsUtils'

type ThemeWrapperProps = {
  children: ReactNode
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { themeKey, setThemeKey, isLoadingUserSettings, setIsLoadingUserSettings } = useContext(ThemeModeContext)
  const [userTheme, setUserTheme] = useState<Theme | undefined>(lightTheme)

  const updateTheme = useCallback(
    (newThemeKey: string) => {
      const themeToUse = themeList.find((e) => e.key === newThemeKey)
      if (themeToUse) {
        const mode = themeToUse.theme.palette.mode === 'dark' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-color-mode', mode)
        setUserTheme(themeToUse.theme)
        setThemeKey(newThemeKey)
      }
    },
    [setThemeKey],
  )

  const handleUserSettings = useCallback(async () => {
    const userSettings = await getUserSettings()
    if (userSettings) {
      updateTheme(userSettings.themeKey)
    }
    setIsLoadingUserSettings(false)
  }, [updateTheme, setIsLoadingUserSettings])

  useEffect(() => {
    handleUserSettings()
  }, [handleUserSettings])

  useEffect(() => {
    updateTheme(themeKey)
  }, [themeKey, updateTheme])

  return (
    <>
      {userTheme && !isLoadingUserSettings && <ThemeProvider theme={userTheme}>{children}</ThemeProvider>}
      {!userTheme && isLoadingUserSettings && <Loading />}
    </>
  )
}
