/**
 * Uses the Local Storage browser API to store user preferences.
 */

export interface UserPreferences {
  displayFormPercentageComplete: boolean
}

const defaultPreferences: UserPreferences = {
  displayFormPercentageComplete: false,
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
