/**
 * Uses the Local Storage browser API to store provided user preferences.
 */

export interface UserPreferences {
  displayFormStats: boolean
  hiddenDeploymentAssessmentColumns: string[]
}

const defaultPreferences: UserPreferences = {
  displayFormStats: false,
  hiddenDeploymentAssessmentColumns: [],
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

export const getHiddenDeploymentAssessmentColumns = (): string[] => {
  const preferences: UserPreferences = getUserPreferences()
  return preferences?.hiddenDeploymentAssessmentColumns ?? []
}

export const saveHiddenDeploymentAssessmentColumns = (columnKeys: string[]) => {
  const preferences: UserPreferences = getUserPreferences() ?? defaultPreferences
  preferences.hiddenDeploymentAssessmentColumns = columnKeys
  saveUserPreferences(preferences)
}
