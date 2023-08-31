import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'
import { toEntity } from '../../../utils/v2/entity.js'
import { BaseAuthorisationConnector, ModelActionKeys } from './index.js'

export class SillyAuthorisationConnector implements BaseAuthorisationConnector {
  constructor() {
    // do nothing
  }

  async userModelAction(_user: UserDoc, _model: ModelDoc, _action: ModelActionKeys) {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async userReleaseAction(_user: UserDoc, _model: ModelDoc, _release: ReleaseDoc, _action: string): Promise<boolean> {
    // With silly authorisation, every user can complete every action.
    return true
  }

  async getEntities(user: UserDoc) {
    return [toEntity('user', user.dn)]
  }
}
