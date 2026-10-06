import { EntryInterface, EntryRole, RoleKeys, User, UserV3 } from 'types/types'

export function getRoleDisplayName(roleShortName: string, entryRoles: EntryRole[]) {
  const role = entryRoles.find((role) => role.shortName === roleShortName)
  if (role) {
    return role.name
  }
  return roleShortName
}

export const getCurrentUserRoles = (entry: EntryInterface | undefined, currentUser: User | undefined) => {
  return entry?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles || []
}

export const isAuthorisedToCreateUntrustedModel = (currentUser: UserV3, requiredRole: RoleKeys): boolean => {
  return requiredRole && currentUser.systemRoles.includes(requiredRole)
}
