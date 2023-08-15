import { NextFunction, Request, Response } from 'express'

import user from '../connectors/v2/user/index.js'

export async function getUser(req: Request, _res: Response, next: NextFunction) {
  // this function must never fail to call next, even when
  // no user is found.
  const userInfo = await user.getUserFromReq(req)

  // no user found
  if (userInfo === undefined) return next()

  req.user = userInfo

  return next()
}
