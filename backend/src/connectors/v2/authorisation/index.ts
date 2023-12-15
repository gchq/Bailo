import config from '../../../utils/v2/config.js'
import { BasicAuthorisationConnector } from './base.js'

let authConnector: undefined | BasicAuthorisationConnector = undefined
export function getAuthorisationConnector(cache = true): BasicAuthorisationConnector {
  if (authConnector && cache) {
    return authConnector
  }

  switch (config.connectors.authorisation.kind) {
    case 'basic':
      authConnector = new BasicAuthorisationConnector()
      break
    default:
      throw new Error('No valid authorisation connector provided.')
  }

  return authConnector
}

export default getAuthorisationConnector()
