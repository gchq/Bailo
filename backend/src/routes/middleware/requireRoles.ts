import { RequestHandler } from 'express'

import { RoleKeys } from '../../connectors/authentication/constants.js'
import authentication from '../../connectors/authentication/index.js'
import { Forbidden, Unauthorized } from '../../utils/error.js'

export function requireRoles(roles: RoleKeys[]): RequestHandler {
  return async (req, _res, next) => {
    if (!req.user) {
      throw Unauthorized('No valid authentication provided.')
    }

    for (const role of roles) {
      if (!(await authentication.hasRole(req.user, role))) {
        throw Forbidden('You do not have the required role.', {
          userDn: req.user.dn,
          requiredRole: role,
        })
      }
    }

    next()
  }
}

export function requireRole(role: RoleKeys): RequestHandler {
  return requireRoles([role])
}
