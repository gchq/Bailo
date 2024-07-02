import { EntryInterface, Role, User } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

export function getRoleDisplay(roleId: string, modelRoles: Role[]) {
  const role = modelRoles.find((role) => role.id === roleId)
  if (!role) return 'Unknown Role'

  return role.name
}

export const hasRole = (userRoles: string[], validRoles: string[]) => {
  return userRoles.some((role) => validRoles.includes(role))
}

export const getCurrentUserRoles = (entry: EntryInterface | undefined, currentUser: User | undefined) => {
  return entry?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles || []
}

export const getRequiredRolesText = (userRoles: string[], validRoles: string[]) => {
  if (!validRoles.length || hasRole(userRoles, validRoles)) {
    return ''
  } else if (validRoles.length === 1) {
    return `${toTitleCase(validRoles[0])} role required`
  }

  const last = toTitleCase(`${validRoles.pop()}`)
  return `${validRoles.map((role) => toTitleCase(role)).join(', ')} or ${last} role required`
}
