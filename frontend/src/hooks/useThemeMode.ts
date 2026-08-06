import { Theme } from '@mui/material/styles'
import { useCallback, useState } from 'react'

import { darkTheme, lightTheme } from '../theme'

export type ThemeModeHook = {
  theme: Theme
  toggleDarkMode: (isDark: boolean) => void
}

export default function useThemeMode(): ThemeModeHook {
  const [theme, setTheme] = useState(
    typeof window !== 'undefined' && localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme,
  )

  const toggleDarkMode = useCallback((isDark: boolean) => {
    localStorage.setItem('dark_mode_enabled', `${isDark}`)
    setTheme(localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme)
  }, [])

  return {
    theme,
    toggleDarkMode,
  }
}
