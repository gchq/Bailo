import { ModelDoc } from '../../../models/v2/Model.js'
import { UserDoc } from '../../../models/v2/User.js'
import config from '../../../utils/v2/config.js'
import { SillyAuthorisationConnector } from './silly.js'

export const ModelAction = {
  Create: 'create',
  View: 'view',
} as const

export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export abstract class BaseAuthorisationConnector {
  abstract userModelAction(user: UserDoc, model: ModelDoc, action: ModelActionKeys): Promise<boolean>
}

let authConnector: undefined | BaseAuthorisationConnector = undefined
export function getAuthorisationConnector() {
  if (authConnector) {
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
