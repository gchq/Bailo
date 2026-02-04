import { NextFunction, Request, Response } from 'express'

import { escalateUserIfAuthorised } from '../../services/escalation.js'

/**
 * Check if a request needs escalation, and if authorised then escalate it
 * from the system proc user to the original requesting user.
 */
export async function escalateUser(req: Request, _res: Response, next: NextFunction) {
  // Check if escalation is required and escalate if authorised to do so
  req = escalateUserIfAuthorised(req)
  next()
}
