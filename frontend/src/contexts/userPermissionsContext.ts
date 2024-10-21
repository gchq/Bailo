import { createContext } from 'react'
import { defaultPermissions, UserPermissionsHook } from 'src/hooks/UserPermissionsHook'

const UserPermissionsContext = createContext<UserPermissionsHook>({
  userPermissions: defaultPermissions,
  setUserPermissions: () => undefined,
})

export default UserPermissionsContext
