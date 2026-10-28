import { createContext } from 'react'
import { defaultUserPermissions, type UserPermissionsHook } from 'src/hooks/UserPermissionsHook'

const UserPermissionsContext = createContext<UserPermissionsHook>({
  userPermissions: defaultUserPermissions,
})

export default UserPermissionsContext
