import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'
import config from '../../../utils/v2/config.js'
import { SillyAuthorisationConnector } from './silly.js'

export const ModelAction = {
  Create: 'create',
  View: 'view',
  UploadFile: 'upload_file',
  Write: 'write',
} as const
export type ModelActionKeys = (typeof ModelAction)[keyof typeof ModelAction]

export const ReleaseAction = {
  Create: 'create',
  View: 'view',
  Delete: 'delete',
}
export type ReleaseActionKeys = (typeof ReleaseAction)[keyof typeof ReleaseAction]

export abstract class BaseAuthorisationConnector {
  abstract userModelAction(user: UserDoc, model: ModelDoc, action: ModelActionKeys): Promise<boolean>
  abstract userReleaseAction(
    user: UserDoc,
    model: ModelDoc,
    release: ReleaseDoc,
    action: ReleaseActionKeys,
  ): Promise<boolean>
  abstract getEntities(user: UserDoc): Promise<Array<string>>
  abstract getUserInformation(userEntity: string): Promise<{ email: string }>
  abstract getUserInformationList(userEntity: string): Promise<Promise<{ email: string }>[]>
  abstract getEntityMembers(entity: string): Promise<Array<string>>
}

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
