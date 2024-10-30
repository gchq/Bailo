import { createContext } from 'react'
import { defaultUserPermissions, UserPermissionsHook } from 'src/hooks/UserPermissionsHook'

const UserPermissionsContext = createContext<UserPermissionsHook>({
  userPermissions: defaultUserPermissions,
  setEntryId: () => undefined,
  setAccessRequestId: () => undefined,
})

export default UserPermissionsContext
