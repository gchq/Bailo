import { Request, Response, NextFunction } from 'express'
import config from 'config'
import UserModel from '../models/User'
import memoize from 'memoizee'
import { User } from '../../types/interfaces'
import { timingSafeEqual } from 'crypto'
import { getAdminToken } from '../routes/v1/registryAuth'

export async function findUser(userId: string, email?: string) {
  // findOneAndUpdate is atomic, so we don't need to worry about
  // multiple threads calling this simultaneously.
  return await UserModel.findOneAndUpdate(
    { $or: [{ id: userId }, { email }] },
    { id: userId, email }, // upsert docs
    { new: true, upsert: true }
  )
}

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

// This is an authentication function.  Take care whilst editting it.  Notes:
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

  const user = await UserModel.findOne({
    id: username,
  }).select('+token')

  if (!user) {
    return { error: 'User not found' }
  }

  const isValid = await user.compareToken(token)

  if (!isValid) {
    return { error: 'Incorrect token is wrong' }
  }

  return { user }
}

// cache user status for
const findUserCached = memoize(findUser, {
  promise: true,
  primitive: true,
  maxAge: 5000,
})

export async function getUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.get('x-userid')
  const email = req.get('x-email')

  if (!userId || !email) return next()

  const user = await findUserCached(userId, email)
  req.user = user

  next()
}

export function hasRole(roles: Array<string> | string, user: User) {
  const arrayRoles = typeof roles === 'string' ? [roles] : roles

  for (let role of arrayRoles) {
    if (!user.roles.includes(role)) {
      return false
    }
  }

  return true
}

export function ensureUserRole(roles: Array<string> | string) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      req.log.warn('Unable to authenticate request')
      return res.status(403).json({
        message: `Unable to authenticate request`,
      })
    }

    const arrayRoles = typeof roles === 'string' ? [roles] : roles

    for (let role of arrayRoles) {
      if (!req.user.roles.includes(role)) {
        req.log.warn({ requestedRole: role, currentRoles: req.user.roles }, 'User does not have required role')
        return res.status(401).json({
          message: `You do not have the '${role}' role`,
        })
      }
    }

    next()
  }
}
