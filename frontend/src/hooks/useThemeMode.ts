import { useState } from 'react'

export type ThemeModeHook = {
  themeKey: string
  setThemeKey: (value: string) => void
  isLoadingUserSettings: boolean
  setIsLoadingUserSettings: (value: boolean) => void
}

export default function useThemeMode(): ThemeModeHook {
  const [themeKey, setThemeKey] = useState<string>('light')
  const [isLoadingUserSettings, setIsLoadingUserSettings] = useState<boolean>(true)

  return {
    themeKey,
    setThemeKey,
    isLoadingUserSettings,
    setIsLoadingUserSettings,
  }
}
