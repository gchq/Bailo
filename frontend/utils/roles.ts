import { Role } from '../types/v2/types'

export function getRoleDisplay(roleId: string, modelRoles: Role[]) {
  const role = modelRoles.find((role) => role.id === roleId)
  if (!role) return 'Unknown Role'

  return role.name
}
