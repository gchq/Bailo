import { EntryInterface, SystemRole, User } from 'types/types'

export function getRoleDisplayName(roleId: string, entryRoles: SystemRole[]) {
  const role = entryRoles.find((role) => role.id === roleId)
  if (role) {
    return role.name
  }
  return 'Unknown Role'
}

export const hasRole = (userRoles: string[], validRoles: string[]) => {
  return userRoles.some((role) => validRoles.includes(role))
}

export const getCurrentUserRoles = (entry: EntryInterface | undefined, currentUser: User | undefined) => {
  return entry?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles || []
}
