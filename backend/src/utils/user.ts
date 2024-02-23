import { timingSafeEqual } from 'crypto'
import { NextFunction, Request, Response } from 'express'

import Authorisation from '../connectors/Authorisation.js'
import { TokenDoc } from '../models/v2/Token.js'
import { bailoErrorGuard } from '../routes/middleware/expressErrorHandler.js'
import { getAdminToken } from '../routes/registryAuth.js'
import { findAndUpdateUser, findUserCached, getUserById } from '../services/user.js'
import { getTokenFromAuthHeader } from '../services/v2/token.js'
import { UserDoc } from '../types/types.js'
import { Forbidden, Unauthorised } from './result.js'

const auth = new Authorisation()

function safelyCompareTokens(expected: string, actual: string) {
  // This is not constant time, which will allow a user to calculate the length
  // of the token.  However, the token is a uuidv4() of constant length, so this
  // is acceptable.
  if (expected.length !== actual.length) {
    return false
  }

  // This comparison must be safe against timing attacks
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return false
  }

  return true
}

// This is an authentication function.  Take care whilst editing it.  Notes:
// - the password is not hashed, so comparisons _must_ be done in constant time
export async function getUserFromAuthHeader(
  header: string,
): Promise<{ error?: string; user?: any; admin?: boolean; token?: TokenDoc }> {
  const [method, code] = header.split(' ')

  if (method.toLowerCase() !== 'basic') {
    return { error: 'Incorrect authorization type' }
  }

  const [username, token] = Buffer.from(code, 'base64').toString('utf-8').split(':')

  if (!username || !token) {
    return { error: 'Username and password not provided' }
  }

  if (safelyCompareTokens(await getAdminToken(), token)) {
    return { user: { _id: '', id: '' }, admin: true }
  }

  const user = await getUserById(username, { includeToken: true })

  if (user) {
    const isValid = await user.compareToken(token)

    if (!isValid) {
      return { error: 'Incorrect token is wrong' }
    }

    return { user }
  }

  let tokenDoc: TokenDoc | undefined = undefined
  try {
    tokenDoc = await getTokenFromAuthHeader(header)
  } catch (e: unknown) {
    if (bailoErrorGuard(e) && e.code) {
      return { error: e.message }
    } else {
      throw e
    }
  }

  if (!tokenDoc) {
    return { error: 'No user found' }
  }

  return {
    token: tokenDoc,
    user: {
      _id: tokenDoc.user,
      id: tokenDoc.user,
      dn: tokenDoc.user,
    },
  }
}

export async function getUser(req: Request, _res: Response, next: NextFunction) {
  // this function must never fail to call next, even when
  // no user is found.

  const userInfo = await auth.getUserFromReq(req)

  // no user found
  if (userInfo.userId === undefined) return next()

  const user = process.env.NODE_ENV !== 'test' ? await findUserCached(userInfo) : await findAndUpdateUser(userInfo)
  req.user = user

  return next()
}

export function hasRole(roles: Array<string> | string, user: UserDoc) {
  const arrayRoles = typeof roles === 'string' ? [roles] : roles

  for (const role of arrayRoles) {
    if (!user.roles.includes(role)) {
      return false
    }
  }

  return true
}

export function ensureUserRole(roles: Array<string> | string) {
  return function ensureUserRoleMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
      throw Unauthorised({}, `Unable to authenticate request`)
    }

    const arrayRoles = typeof roles === 'string' ? [roles] : roles

    for (const role of arrayRoles) {
      if (!req.user.roles.includes(role)) {
        throw Forbidden({ requestedRole: role, currentRoles: req.user.roles }, `You do not have the '${role}' role`)
      }
    }

    next()
  }
}
