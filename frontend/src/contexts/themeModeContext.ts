import { createContext } from 'react'

import { type ThemeModeHook } from '../hooks/useThemeMode'
import { lightTheme } from '../theme'

const ThemeModeContext = createContext<ThemeModeHook>({
  theme: lightTheme,
  toggleDarkMode: () => null,
})

export default ThemeModeContext
