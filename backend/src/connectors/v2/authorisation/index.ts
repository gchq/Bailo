import config from '../../../utils/v2/config.js'
import { BaseAuthorisationConnector } from './Base.js'
import { SillyAuthorisationConnector } from './silly.js'

let authConnector: undefined | BaseAuthorisationConnector = undefined
export function getAuthorisationConnector(cache = true) {
  if (authConnector && cache) {
    return authConnector
  }

  switch (config.connectors.authorisation.kind) {
    case 'silly':
      authConnector = new SillyAuthorisationConnector()
      break
    default:
      throw new Error('No valid authorisation connector provided.')
  }

  return authConnector
}

export default getAuthorisationConnector()
