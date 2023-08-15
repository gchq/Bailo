import { ModelDoc } from '../../../models/v2/Model.js'
import { UserDoc } from '../../../models/v2/User.js'
import { BaseAuthorisationConnector, ModelActionKeys } from './index.js'

export class SillyAuthorisationConnector implements BaseAuthorisationConnector {
  constructor() {
    // do nothing
  }

  async userModelAction(_user: UserDoc, _model: ModelDoc, _action: ModelActionKeys) {
    // With silly authorisation, every user can complete every action.
    return true
  }
}
