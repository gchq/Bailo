import { createContext } from 'react'

import { ThemeModeHook } from '../hooks/useThemeMode'

const ThemeModeContext = createContext<ThemeModeHook>({
  themeKey: '',
  setThemeKey: (_value: string) => null,
  isLoadingUserSettings: true,
  setIsLoadingUserSettings: (_value: boolean) => null,
})

export default ThemeModeContext
