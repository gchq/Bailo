import config from '../../../utils/v2/config.js'
import { BaseAuthenticationConnector } from './Base.js'
import { SillyAuthenticationConnector } from './silly.js'

let authenticationConnector: undefined | BaseAuthenticationConnector = undefined
export function getAutheticationConnector(cache = true) {
  if (authenticationConnector && cache) {
    return authenticationConnector
  }

  switch (config.connectors.authentication.kind) {
    case 'silly':
      authenticationConnector = new SillyAuthenticationConnector()
      break
    default:
      throw new Error('No valid user connector provided.')
  }

  return authenticationConnector
}

export default getAutheticationConnector()
