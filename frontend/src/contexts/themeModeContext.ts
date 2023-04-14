import { createContext } from 'react'

import { ThemeModeHook } from '../../utils/hooks/useThemeMode'
import { lightTheme } from '../theme'

const ThemeModeContext = createContext<ThemeModeHook>({
  theme: lightTheme,
  toggleDarkMode: () => null,
})

export default ThemeModeContext
