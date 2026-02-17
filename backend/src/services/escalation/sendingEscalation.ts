/**
 * This file contains functions used by a Bailo instance
 * in order to send user escalation requests to other Bailo instances.
 */

import config from '../../utils/config.js'

export const USER_HEADER = 'x-user'
export const BAILO_ID_HEADER = 'x-bailo-id'

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
