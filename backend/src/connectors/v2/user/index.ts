import { Request } from 'express'

import { User } from '../../../types/v2/types.js'
import config from '../../../utils/v2/config.js'
import { SillyUserConnector } from './silly.js'

export abstract class BaseUserConnector {
  abstract getUserFromReq(req: Request): Promise<User>
}

let userConnector: undefined | BaseUserConnector = undefined
export function getUserConnector(cache = true) {
  if (userConnector && cache) {
    return userConnector
  }

  switch (config.connectors.user.kind) {
    case 'silly':
      userConnector = new SillyUserConnector()
      break
    default:
      throw new Error('No valid user connector provided.')
  }

  return userConnector
}

export default getUserConnector()
