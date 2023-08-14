import { NextFunction, Request, Response } from 'express'

export async function getUser(req: Request, _res: Response, next: NextFunction) {
  console.log('auto mocked getUser')
  next()
}

export function ensureUserRole() {
  return function ensureUserRoleMiddleware(req: Request, _res: Response, next: NextFunction) {
    console.log('auto mocked ensureUserRole')
    next()
  }
}
