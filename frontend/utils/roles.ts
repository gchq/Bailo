import { EntryInterface, Role, User } from 'types/types'

export function getRoleDisplay(roleShort: string, modelRoles: Role[]) {
  const role = modelRoles.find((role) => role.short === roleShort)
  if (!role) return 'Unknown Role'

  return role.name
}

export const hasRole = (userRoles: string[], validRoles: string[]) => {
  return userRoles.some((role) => validRoles.includes(role))
}

export const getCurrentUserRoles = (entry: EntryInterface | undefined, currentUser: User | undefined) => {
  return entry?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles || []
}
