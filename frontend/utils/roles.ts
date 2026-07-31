import { EntryInterface, EntryRole, User } from 'types/types'

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
