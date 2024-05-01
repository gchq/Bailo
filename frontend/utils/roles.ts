import { Role } from '../types/types'

export function getRoleDisplay(roleId: string, modelRoles: Role[]) {
  const role = modelRoles.find((role) => role.id === roleId)
  if (!role) return 'Unknown Role'

  return role.name
}

export const hasRole = (userRoles: string[], validRoles: string[]) => {
  return userRoles.some((role) => validRoles.includes(role))
}
