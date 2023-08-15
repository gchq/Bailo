import config from '../../../utils/v2/config.js'
import { SillyUserConnector } from './silly.js'

export abstract class BaseUserConnector {}

let userConnector: undefined | BaseUserConnector = undefined
export async function getUserConnector(cache = true) {
  if (userConnector && cache) {
    return userConnector
  }

  switch (config.connectors.user.kind) {
    case 'silly':
      userConnector = await SillyUserConnector.init()
      break
    default:
      throw new Error('No valid user connector provided.')
  }

  return userConnector
}

export default getUserConnector()
