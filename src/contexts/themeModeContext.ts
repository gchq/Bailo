import { createContext } from 'react'
import { ThemeModeHook } from '../../utils/hooks/useThemeMode.js'
import { lightTheme } from '../theme.js'

const ThemeModeContext = createContext<ThemeModeHook>({
  theme: lightTheme,
  toggleDarkMode: () => null,
})

export default ThemeModeContext
