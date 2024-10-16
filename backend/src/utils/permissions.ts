import { Response } from '../connectors/authorisation/base.js'
import { PermissionDetail } from '../types/types.js'

export const authResponseToUserPermission = (authResponse: Response): PermissionDetail => {
  return authResponse.success
    ? { hasPermission: authResponse.success }
    : {
        hasPermission: authResponse.success,
        info: authResponse.info,
      }
}
