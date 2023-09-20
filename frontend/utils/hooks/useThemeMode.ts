import { Theme } from '@mui/material/styles'
import { ChangeEvent, useCallback, useState } from 'react'

import { betaLightTheme, darkTheme, lightTheme } from '../../src/theme'

export type ThemeModeHook = {
  theme: Theme
  toggleDarkMode: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function useThemeMode(): ThemeModeHook {
  const lightThemeToUse =
    typeof window !== 'undefined' && window.location.pathname.includes('/beta') ? betaLightTheme : lightTheme

  const [theme, setTheme] = useState(
    typeof window !== 'undefined' && localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightThemeToUse
  )

  const toggleDarkMode = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem('dark_mode_enabled', `${event.target.checked}`)
      setTheme(localStorage.getItem('dark_mode_enabled') === 'true' ? darkTheme : lightThemeToUse)
    },
    [lightThemeToUse]
  )

  return {
    theme,
    toggleDarkMode,
  }
}
