import { Request } from 'express'

import log from '../services/log.js'
import { EscalationDetails } from '../types/types.js'
import config from '../utils/config.js'

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
    log.warn({}, `The user ${userId} is not in the allow list under instance ${instanceId}.`)
    return false
  }
  return true
}

export const escalateUserIfAuthorised = (req: Request): Request => {
  const headers = req.headers
  const requestingUser = headers['x-user']
  const bailoId = headers['x-bailo-id']

  // If the user and bailoId are provided then the request is to escalate to the original requesting user
  if (requestingUser && bailoId && typeof bailoId === 'string') {
    // Check the requesting proc user is authorised and part of an accepted Bailo instance
    const isAuthorised = isAuthorisedToEscalate(req.user, bailoId)
    if (isAuthorised) {
      // Escalate from the system proc user to the original requesting user
      req.user = { dn: requestingUser }
    }
  }
  return req
}
