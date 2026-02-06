/**
 * Uses the Local Storage browser API to store provided user preferences.
 */

export interface UserPreferences {
  displayFormStats: boolean
}

const defaultPreferences: UserPreferences = {
  displayFormStats: false,
}

const USER_PREFERENCES_KEY = 'user-preferences'

/**
 * Save the users preferences to browser storage.
 * @param preferences The UserPreferences to save.
 */
export const saveUserPreferences = (preferences: UserPreferences) => {
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences))
}

/**
 * Get the users preferences from browser storage.
 * @returns The UserPreferences.
 */
export const getUserPreferences = (): UserPreferences => {
  const storedValue = localStorage.getItem(USER_PREFERENCES_KEY)
  return storedValue ? JSON.parse(storedValue) : defaultPreferences
}

/**
 * Get the boolean to dictate if stats should be displayed.
 * @returns The boolean for displaying form stats.
 */
export const getDisplayFormStats = (): boolean => {
  const preferences: UserPreferences = getUserPreferences()
  return preferences?.displayFormStats ?? false
}

/**
 * Save the boolean for whether or not to display stats.
 */
export const saveDisplayFormStats = (newValue: boolean) => {
  const preferences: UserPreferences = getUserPreferences() ?? defaultPreferences
  preferences.displayFormStats = newValue
  saveUserPreferences(preferences)
}
