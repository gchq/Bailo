import { NextFunction, Request, Response } from 'express'

import authentication from '../../connectors/v2/authentication/index.js'

export async function getUser(req: Request, _res: Response, next: NextFunction) {
  // this function must never fail to call next, even when
  // no user is found.
  const userInfo = await authentication.getUserFromReq(req)
  req.user = userInfo

  return next()
}
