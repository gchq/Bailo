import { Request } from 'express'

import log from '../services/log.js'
import { EscalationDetails } from '../types/types.js'
import config from '../utils/config.js'

const USER_HEADER = 'x-user'
const BAILO_ID_HEADER = 'x-bailo-id'

/**
 * Generate headers to escalate the request in the receiving Bailo instance.
 */
export const generateEscalationHeaders = (requestingUserId: string): Headers => {
  // If user is provided and escalation is enabled
  if (requestingUserId !== '' && config.escalation.isEnabled) {
    return new Headers({
      [USER_HEADER]: requestingUserId,
      [BAILO_ID_HEADER]: config.federation.id,
    })
  }
  return new Headers({
    [BAILO_ID_HEADER]: config.federation.id,
  })
}

/**
 * Checks if the provided user is in the allow list under an allowed bailo instance.
 * @param user The users id
 * @param instance The Bailo instance id
 */
export const isAuthorisedToEscalate = (userId: string, instanceId: string): boolean => {
  const allowedInstances = config?.escalation?.allowed

  // Check there are allowed instances
  if (!Array.isArray(allowedInstances) || allowedInstances.length === 0) {
    log.warn('There are no Bailo instances in the allow list.')
    return false
  }

  // Check the given user is authorised under the specified bailo instance
  const instance = allowedInstances.find((entry: EscalationDetails) => entry.instanceId === instanceId)
  const isAuthorised = instance?.userIds.includes(userId) ?? false

  if (!isAuthorised) {
    log.warn({}, `The system user ${userId} is not in the allow list under instance ${instanceId}.`)
    return false
  }

  return true
}

/**
 * Checks if escalation is required, then escalate if authorised.
 *
 * If the user is provided as a header then assume escalation is required,
 * if so then check if authorised to escalate.
 */
export const escalateUserIfAuthorised = (req: Request): Request => {
  const headers = req.headers
  const requestingUser = headers[USER_HEADER]
  const bailoId = headers[BAILO_ID_HEADER]

  if (requestingUser && bailoId && typeof bailoId === 'string') {
    // Check the requesting proc user is authorised and part of an accepted Bailo instance
    const isAuthorised = isAuthorisedToEscalate(req.user.dn, bailoId)
    if (isAuthorised) {
      // Escalate from the system proc user to the original requesting user
      req.user = { dn: requestingUser }
      log.info({}, `The system user ${req.user.dn} has been escalated to user ${requestingUser}.`)
    }
  }
  return req
}
