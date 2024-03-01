import { Theme } from '@mui/material/styles'
import { useCallback, useState } from 'react'

import { lightTheme, themeList } from '../theme'

export type ThemeModeHook = {
  theme: Theme
  setTheme: (newTheme: string) => void
}

export default function useThemeMode(): ThemeModeHook {
  const savedUserTheme = themeList.find(
    (e) => typeof window !== 'undefined' && e.key === localStorage.getItem('user_theme'),
  )?.theme
  const themeToUse = savedUserTheme ? savedUserTheme : lightTheme
  const [theme, setUserTheme] = useState<Theme>(themeToUse)

  const setTheme = useCallback((newTheme: string) => {
    localStorage.setItem('user_theme', `${newTheme}`)

    setUserTheme(themeList.find((e) => e.key === localStorage.getItem('user_theme'))?.theme || lightTheme)
  }, [])

  return {
    theme,
    setTheme,
  }
}
