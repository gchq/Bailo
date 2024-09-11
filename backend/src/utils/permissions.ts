import { toTitleCase } from './string.js'

export const userHasPermission = (
  userRoles: string[],
  validRoles: string[],
  isMirroredModel: boolean,
  isActionUnavailableForMirroredModels: boolean,
) => {
  if (isMirroredModel && isActionUnavailableForMirroredModels) {
    return false
  }

  return userRoles.some((role) => validRoles.includes(role))
}

export const getReason = (
  userRoles: string[],
  validRoles: string[],
  isMirroredModel: boolean,
  isActionUnavailableForMirroredModels: boolean,
) => {
  if (isMirroredModel && isActionUnavailableForMirroredModels) {
    return 'Unavailable for mirrored models'
  }

  if (
    !validRoles.length ||
    userHasPermission(userRoles, validRoles, isMirroredModel, isActionUnavailableForMirroredModels)
  ) {
    return ''
  } else if (validRoles.length === 1) {
    return `${toTitleCase(validRoles[0])} role required`
  }

  const last = toTitleCase(`${validRoles.pop()}`)
  return `${validRoles.map((role) => toTitleCase(role)).join(', ')} or ${last} role required`
}
