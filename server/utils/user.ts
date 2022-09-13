import { timingSafeEqual } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import Authorisation from '../external/Authorisation'
import { UserDoc } from '../models/User'
import { getAdminToken } from '../routes/v1/registryAuth'
import { findUserCached, getUserById } from '../services/user'
import { Forbidden, Unauthorised } from './result'

const auth = new Authorisation()

function safelyCompareTokens(expected, actual) {
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
export async function getUserFromAuthHeader(header: string): Promise<{ error?: string; user?: any; admin?: boolean }> {
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

  if (!user) {
    return { error: 'User not found' }
  }

  const isValid = await user.compareToken(token)

  if (!isValid) {
    return { error: 'Incorrect token is wrong' }
  }

  return { user }
}

export async function getUser(req: Request, _res: Response, next: NextFunction) {
  // this function must never fail to call next, even when
  // no user is found.

  const userInfo = await auth.getUserFromReq(req)

  // no user found
  if (!userInfo.userId) return next()

  const user = await findUserCached(userInfo)
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
  return function (req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
      throw Forbidden({}, `Unable to authenticate request`)
    }

    const arrayRoles = typeof roles === 'string' ? [roles] : roles

    for (const role of arrayRoles) {
      if (!req.user.roles.includes(role)) {
        throw Unauthorised({ requestedRole: role, currentRoles: req.user.roles }, `You do not have the '${role}' role`)
      }
    }

    next()
  }
}
