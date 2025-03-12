import { UserSettings } from 'types/types'

interface UserSettingsResponse {
  settings: UserSettings
}

export async function getUserSettings() {
  // Update theme property to be themeKey in UserSettings backend/frontend
  const res = await fetch('/api/v2/user/settings', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    return undefined
  }

  const body: UserSettingsResponse = await res.json()

  return body.settings
}
