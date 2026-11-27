/**
 * Uses the Local Storage browser API to store provided user preferences.
 */

export interface UserPreferences {
  displayFormStats: boolean
  snowEnabled?: boolean
}

const defaultPreferences: UserPreferences = {
  displayFormStats: false,
  snowEnabled: false,
}

const USER_PREFERENCES_KEY = 'user-preferences'

export const saveUserPreferences = (preferences: UserPreferences) => {
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences))
}

export const getUserPreferences = (): UserPreferences => {
  const storedValue = localStorage.getItem(USER_PREFERENCES_KEY)
  return storedValue ? { ...defaultPreferences, ...JSON.parse(storedValue) } : defaultPreferences
}

export const getDisplayFormStats = (): boolean => {
  const preferences: UserPreferences = getUserPreferences()
  return preferences?.displayFormStats ?? false
}

export const saveDisplayFormStats = (newValue: boolean) => {
  const preferences: UserPreferences = getUserPreferences() ?? defaultPreferences
  preferences.displayFormStats = newValue
  saveUserPreferences(preferences)
}

// Without a saved choice, respect the operating system's reduced motion setting
export const getSnowEnabled = (): boolean => {
  return getUserPreferences().snowEnabled ?? !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export const saveSnowEnabled = (newValue: boolean) => {
  saveUserPreferences({ ...getUserPreferences(), snowEnabled: newValue })
}
