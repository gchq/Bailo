import { Theme } from '@mui/material/styles'
import { ChangeEvent, useCallback, useState } from 'react'
import { darkTheme, lightTheme } from '../../src/theme'

export type ThemeModeHook = {
  theme: Theme
  toggleDarkMode: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function useThemeMode(): ThemeModeHook {
  const [theme, setTheme] = useState(
    typeof window !== 'undefined' && localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme
  )

  const toggleDarkMode = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('dark_mode_enabled', `${event.target.checked}`)
    setTheme(localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightTheme)
  }, [])

  return {
    theme,
    toggleDarkMode,
  }
}
