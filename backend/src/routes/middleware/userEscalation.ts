import { NextFunction, Request, Response } from 'express'

import log from '../../services/log.js'
import config from '../../utils/config.js'

export const USER_HEADER = 'x-user'
export const BAILO_ID_HEADER = 'x-bailo-id'

/**
 * Checks if the provided user is in the allow list under an allowed bailo instance.
 * @param user The userId - This will be the system or proc user.
 * @param instance The Bailo federation instanceId.
 */
export const isAuthorisedToEscalate = (userId: string, instanceId: string): boolean => {
  // const peer = config.federation.peers.get(instanceId)
  const peer = config.federation.peers[instanceId]
  if (!peer) {
    log.warn(`${instanceId} is not a known Bailo instance, please update the config if it is missing.`)
    return false
  }

  const allowedUsers = peer.allowedProcUserIds ?? []
  const isAuthorised = allowedUsers.includes(userId)

  if (!isAuthorised) {
    log.warn({}, `The system user ${userId} is not in the allow list under instance ${instanceId}.`)
    return false
  }

  return true
}

/**
 * Check if a request needs escalation, and if authorised then escalate it
 * from the system proc user to the original requesting user.
 */
export async function escalateUser(req: Request, _res: Response, next: NextFunction) {
  // If escalation is enabled then check if the request requires escalating
  if (config.federation.isEscalationEnabled) {
    const requestingUser = req.header(USER_HEADER)
    const bailoId = req.header(BAILO_ID_HEADER)

    if (requestingUser && bailoId && typeof bailoId === 'string') {
      // Check the requesting proc user is authorised and part of an accepted Bailo instance
      const isAuthorised = isAuthorisedToEscalate(req.user.dn, bailoId)
      if (isAuthorised) {
        // Escalate from the system proc user to the original requesting user
        req.user = { dn: requestingUser }
        log.info({}, `The system user ${req.user.dn} has been escalated to user ${requestingUser}.`)
      }
    }
  }
  next()
}
