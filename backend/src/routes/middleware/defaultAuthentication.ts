import { NextFunction, Request, Response } from 'express'

import { getTokenFromAuthHeader as getTokenFromAuthHeaderService } from '../../services/token.js'
import { Unauthorized } from '../../utils/error.js'

export async function getTokenFromAuthHeader(req: Request, _res: Response, next: NextFunction) {
  // This function will fail if the 'authorization' header is provided but invalid.
  const authorization = req.get('authorization')

  if (!authorization) {
    return next()
  }

  const token = await getTokenFromAuthHeaderService(authorization)

  req.user = { dn: token.user, token }

  return next()
}

export function checkAuthentication(req, res, next) {
  if (!req.user) {
    throw Unauthorized('No valid authentication provided.')
  }
  req.log.debug('User successfully authorized.', {
    user: req.user,
  })
  return next()
}
