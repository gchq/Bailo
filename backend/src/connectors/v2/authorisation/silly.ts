import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ModelDoc } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { UserDoc } from '../../../models/v2/User.js'
import { fromEntity, toEntity } from '../../../utils/v2/entity.js'
import { AccessRequestActionKeys, BaseAuthorisationConnector, ModelActionKeys, ReleaseActionKeys } from './Base.js'

const SillyEntityKind = {
  User: 'user',
  Group: 'group',
} as const

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

  async getEntities(user: UserDoc) {
    return [toEntity(SillyEntityKind.User, user.dn)]
  }

  async getUserInformation(entity: string): Promise<{ email: string }> {
    const { kind, value } = fromEntity(entity)

    if (kind !== SillyEntityKind.User) {
      throw new Error(`Cannot get user information for a non-user entity: ${entity}`)
    }

    return {
      email: `${value}@example.com`,
    }
  }

  async getEntityMembers(entity: string): Promise<string[]> {
    const { kind } = fromEntity(entity)
    switch (kind) {
      case SillyEntityKind.User:
        return [entity]
      case SillyEntityKind.Group:
        return [toEntity(SillyEntityKind.User, 'user1'), toEntity(SillyEntityKind.User, 'user2')]
      default:
        throw new Error(`Unable to get members, entity kind not recognised: ${entity}`)
    }
  }
}
