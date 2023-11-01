import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { SchemaDoc } from '../../../models/v2/Schema.js'
import { UserDoc } from '../../../models/v2/User.js'
import authentication from '../authentication/index.js'
import {
  AccessRequestActionKeys,
  BaseAuthorisationConnector,
  ModelActionKeys,
  ReleaseActionKeys,
  SchemaActionKeys,
} from './Base.js'

export class SillyAuthorisationConnector extends BaseAuthorisationConnector {
  constructor() {
    super()
  }

  async userModelAction(user: UserDoc, model: ModelDoc, _action: ModelActionKeys) {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    // Allow any other action to be completed
    return true
  }

  async userReleaseAction(
    user: UserDoc,
    model: ModelDoc,
    _release: ReleaseDoc,
    _action: ReleaseActionKeys,
  ): Promise<boolean> {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    // Allow any other action to be completed
    return true
  }

  async userAccessRequestAction(
    user: UserDoc,
    model: ModelDoc,
    _accessRequest: AccessRequestDoc,
    _action: AccessRequestActionKeys,
  ) {
    // Prohibit non-collaborators from seeing private models
    if (!(await this.hasModelVisibilityAccess(user, model))) {
      return false
    }

    // Allow any other action to be completed
    return true
  }

  async userSchemaAction(user: UserDoc, _schema: SchemaDoc, _action: SchemaActionKeys) {
    return authentication.isAdmin(user)
  }
}
