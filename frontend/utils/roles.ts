import { EntryInterface, SystemRole, SystemRoles, UiConfig, User } from 'types/types'

export function getRoleDisplayName(roleShortName: string, entryRoles: SystemRole[], uiConfig: UiConfig) {
  if (
    roleShortName !== SystemRoles.Consumer &&
    roleShortName !== SystemRoles.Contributor &&
    roleShortName !== SystemRoles.Owner
  ) {
    const role = entryRoles.find((role) => role.shortName === roleShortName)
    if (role) {
      return role.name
    }
  } else {
    if (uiConfig) {
      const dn = uiConfig.roleDisplayNames?.[roleShortName]
      if (dn) {
        return dn
      }
    }
  }
  return roleShortName
}

export const hasRole = (userRoles: string[], validRoles: string[]) => {
  return userRoles.some((role) => validRoles.includes(role))
}

export const getCurrentUserRoles = (entry: EntryInterface | undefined, currentUser: User | undefined) => {
  return entry?.collaborators.find((collaborator) => collaborator.entity.split(':')[1] === currentUser?.dn)?.roles || []
}
