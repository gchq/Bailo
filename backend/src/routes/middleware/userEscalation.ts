import { NextFunction, Request, Response } from 'express'

import { escalateUserIfAuthorised } from '../../services/escalation.js'

/**
 * Check if a request needs escalation, and if authorised then escalate it
 * from the system proc user to the original requesting user.
 */
export async function escalateUser(req: Request, _res: Response, next: NextFunction) {
  // const headers = req.headers
  // const requestingUser = headers['x-user']
  // const bailoId = headers['x-bailo-id']

  // // If the user and bailoId are provided then the request is to escalate to the original requesting user
  // if (requestingUser && bailoId && typeof bailoId === 'string') {
  //   // Check the requesting proc user is authorised and part of an accepted Bailo instance
  //   const isAuthorised = isAuthorisedToEscalate(req.user, bailoId)
  //   if (isAuthorised) {
  //     // Escalate from the system proc user to the original requesting user
  //     req.user = { dn: requestingUser }
  //   }
  // }

  // Check if escalation is required and escalate if authorised to do so
  req = escalateUserIfAuthorised(req)

  next()
}
