import { createContext } from 'react'

import { ThemeModeHook } from '../hooks/useThemeMode'
import { lightTheme } from '../theme'

const ThemeModeContext = createContext<ThemeModeHook>({
  theme: lightTheme,
  setTheme: () => null,
})

export default ThemeModeContext
