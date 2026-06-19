export const Roles = {
  Admin: 'admin',
  Compliance: 'compliance',
} as const
export type RoleKeys = (typeof Roles)[keyof typeof Roles]

export interface UserInformation {
  name?: string
  organisation?: string
  email?: string
}
