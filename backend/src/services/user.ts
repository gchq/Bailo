import { UserInterface } from '../models/User.js'
import { UserSettingsInterface } from '../models/UserSettings.js'
import UserSettingsModel from '../models/UserSettings.js'
import { NotFound } from '../utils/error.js'

export async function findUserSettings(user: UserInterface) {
  const userSettings = await UserSettingsModel.findOne({
    dn: user.dn,
  })

  if (!userSettings) {
    const newUserSettings = new UserSettingsModel({
      dn: user.dn,
      themeKey: 'light',
    })
    newUserSettings.save()
    return newUserSettings
  }

  return userSettings
}

export async function updateUserSettings(user: UserInterface, diff: Partial<UserSettingsInterface>) {
  const userSettings = await UserSettingsModel.findOne({
    dn: user.dn,
  })

  if (!userSettings) {
    throw NotFound('Could not find the settings for the given user')
  }

  Object.assign(userSettings, diff)

  await userSettings.save()
  return userSettings
}
