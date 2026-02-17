/**
 * This file contains functions used by a Bailo instance on
 * receipt of user escalation requests from other Bailo instances.
 */

import { Request } from 'express'

import { EscalationDetails } from '../../types/types.js'
import config from '../../utils/config.js'
import log from '../log.js'
import { BAILO_ID_HEADER, USER_HEADER } from './sendingEscalation.js'

/**
 * Checks if the provided user is in the allow list under an allowed bailo instance.
 * @param user The userId
 * @param instance The Bailo instanceId
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
export const escalateUserIfAuthorised = (req: Request) => {
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
