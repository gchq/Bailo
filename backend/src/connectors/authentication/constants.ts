export const Roles = {
  Admin: 'admin',
} as const
export type RoleKeys = (typeof Roles)[keyof typeof Roles]

export interface UserInformation {
  name?: string
  organisation?: string
  email?: string
}
