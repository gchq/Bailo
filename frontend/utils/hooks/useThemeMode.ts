import { Theme } from '@mui/material/styles'
import { ChangeEvent, useCallback, useState } from 'react'

import { betaLightTheme, darkTheme, lightTheme } from '../../src/theme'
import { ThemeKey } from '../../types/interfaces'

export type ThemeModeHook = {
  theme: Theme
  toggleDarkMode: (event: ChangeEvent<HTMLInputElement>) => void
  setUserTheme: (theme: string) => void
}

const themes: ThemeKey[] = [
  { name: 'Bailo Default', theme: betaLightTheme },
  { name: 'Bailo Classic', theme: lightTheme },
  { name: 'Bailo Dark', theme: darkTheme },
]

export default function useThemeMode(): ThemeModeHook {
  const defaultTheme =
    typeof window !== 'undefined' && window.location.pathname.includes('/beta') ? betaLightTheme : lightTheme

  function getStoredTheme() {
    let theme = defaultTheme
    if (typeof window !== 'undefined') {
      theme = themes.find((theme) => theme.name === localStorage.getItem('user_theme'))?.theme || defaultTheme
    }
    return theme
  }

  const [theme, setTheme] = useState(
    typeof window !== 'undefined' && getStoredTheme() ? getStoredTheme() : defaultTheme,
  )

  // TODO - this can be removed once v2 is released
  const toggleDarkMode = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem('dark_mode_enabled', `${event.target.checked}`)
      setTheme(localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : defaultTheme)
    },
    [defaultTheme],
  )

  const setUserTheme = (themeName: string) => {
    localStorage.setItem('user_theme', `${themeName}`)
    const newTheme = themes.find((theme) => theme.name === themeName)
    if (newTheme) setTheme(newTheme?.theme)
  }

  return {
    theme,
    toggleDarkMode,
    setUserTheme,
  }
}
