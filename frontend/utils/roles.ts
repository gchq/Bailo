import { Role } from '../types/types'

export function getRoleDisplay(roleId: string, modelRoles: Role[]) {
  const role = modelRoles.find((role) => role.id === roleId)
  if (!role) return 'Unknown Role'

  return role.name
}
